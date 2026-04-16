# PhotoPrint Pro - Complete Function Reference

Last Updated: April 16, 2026

---

## 📋 Table of Contents
1. Navigation Functions
2. API Key Management Functions
3. Image Management Functions
4. Canvas & Drawing Functions
5. Background Removal Functions
6. Image Editing Functions
7. Print & Download Functions
8. Crop Tool Functions
9. Modal & UI Functions

---

## 1. Navigation Functions

### `toggleNavMenu()`
- **File:** tool.js (line 33)
- **Purpose:** Toggle mobile navigation menu open/close
- **Parameters:** None
- **Returns:** void
- **Usage:** Called on hamburger menu click
- **Notes:** Animates nav menu visibility on mobile devices

---

## 2. API Key Management Functions

### `loadApiKeysList()`
- **File:** tool.js (line 46)
- **Purpose:** Load saved API keys from browser localStorage
- **Parameters:** None
- **Returns:** void
- **Dependencies:** localStorage API
- **Storage Key:** `ppp_api_keys_list`, `ppp_active_key_id`
- **Logs:** 📂 Loading API Keys from Storage
- **Error Handling:** Catches localStorage errors

### `saveApiKeysList()`
- **File:** tool.js (line 67)
- **Purpose:** Save API keys list to browser localStorage
- **Parameters:** None
- **Returns:** void
- **Storage Key:** `ppp_api_keys_list`, `ppp_active_key_id`
- **Logs:** 💾 Saving API Keys to Storage
- **Error Handling:** Catches localStorage errors

### `addApiKey(key, nickname = '')`
- **File:** tool.js (line 77)
- **Purpose:** Add a new API key to the list
- **Parameters:**
  - `key` (string): The remove.bg API key (min 20 characters)
  - `nickname` (string, optional): A friendly name for the key
- **Returns:** `{success: boolean, error?: string}`
- **Logs:** ➕ Adding new API Key with nickname: [nickname]
- **Validation:** Checks key length ≥ 20 chars, alphanumeric only
- **Notes:** Automatically generates UUID for each key

### `removeApiKey(id)`
- **File:** tool.js (line 107)
- **Purpose:** Delete an API key from the list
- **Parameters:** `id` (string): The key's unique identifier
- **Returns:** void
- **Side Effects:** Removes key from storage, re-renders list
- **Notes:** If deleted key was active, clears active key

### `setActiveKey(id)`
- **File:** tool.js (line 129)
- **Purpose:** Set which API key to use for background removal
- **Parameters:** `id` (string): The key's unique identifier
- **Returns:** void
- **Side Effects:** Updates localStorage, re-renders list

### `editApiKeyNickname(id, newNickname)`
- **File:** tool.js (line 144)
- **Purpose:** Update the nickname/label of a saved API key
- **Parameters:**
  - `id` (string): The key's unique identifier
  - `newNickname` (string): New name for the key
- **Returns:** void
- **Side Effects:** Updates storage, re-renders list

### `renderApiKeysList()`
- **File:** tool.js (line 151)
- **Purpose:** Display all saved API keys in the modal
- **Parameters:** None
- **Returns:** void
- **UI Element:** Updates `#savedKeysList` container
- **Logs:** 📋 Rendering API Keys List - Total keys: [count]
- **Features:** Shows active key with checkmark, action buttons

### `openAddKeyDialog()`
- **File:** tool.js (line 189)
- **Purpose:** Open the "Add New API Key" modal dialog
- **Parameters:** None
- **Returns:** void
- **UI Changes:** Shows `#addKeyModal`
- **Logs:** ➕ Opening Add API Key Dialog
- **Side Effects:** Clears all input fields, focuses on key input

### `openEditKeyDialog(id, nickname)`
- **File:** tool.js (line 220)
- **Purpose:** Open edit dialog for an existing API key
- **Parameters:**
  - `id` (string): Key identifier
  - `nickname` (string): Current nickname
- **Returns:** void
- **UI Changes:** Shows `#addKeyModal` in edit mode

### `closeAddKeyModal()`
- **File:** tool.js (line 230)
- **Purpose:** Close the add/edit API key dialog
- **Parameters:** None
- **Returns:** void
- **Logs:** ✕ Closing Add Key Dialog
- **Side Effects:** Hides modal, clears error messages

### `toggleNewKeyVisibility()`
- **File:** tool.js (line 235)
- **Purpose:** Toggle API key input between password/text mode
- **Parameters:** None
- **Returns:** void
- **UI Element:** Checkbox with id `#showNewKey`

### `saveNewApiKey()`
- **File:** tool.js (line 241)
- **Purpose:** Validate and save a new API key
- **Parameters:** None (reads from form inputs)
- **Returns:** void
- **Logs:** 💾 Saving new API key
- **Validation:**
  - Key must not be empty
  - Key must be ≥ 20 characters
  - Key must be alphanumeric only
- **Error Display:** Shows in `#addKeyErrorMsg`
- **Side Effects:** Closes modal on success, updates storage

### `validateApiKeyLength()`
- **File:** tool.js (line 204)
- **Purpose:** Real-time validation of API key input
- **Parameters:** None
- **Returns:** void
- **UI Element:** Shows/hides error message in real-time
- **Trigger:** Fires on input event of `#newKeyInput`

### `openApiKeyModal()`
- **File:** tool.js (line 1180)
- **Purpose:** Open the main API Key setup modal
- **Parameters:** None
- **Returns:** void
- **Logs:** 🔑 Opening API Key Modal
- **Side Effects:**
  - Loads API keys from storage
  - Closes mobile menu if open
  - Displays appropriate status message based on usage
  - Shows free removals left or API key count

### `closeApiKeyModal()`
- **File:** tool.js (line 1218)
- **Purpose:** Close the API Key setup modal
- **Parameters:** None
- **Returns:** void
- **Logs:** ✕ Closing API Key Modal
- **Side Effects:** Clears error and success messages

### `toggleApiKeyVisibility()`
- **File:** tool.js (line 1229)
- **Purpose:** Show/hide stored API key in display mode
- **Parameters:** None
- **Returns:** void
- **UI Element:** Checkbox with id `#showApiKey`
- **Notes:** Used in legacy API key setup

### `saveApiKey()`
- **File:** tool.js (line 1242)
- **Purpose:** Save API key to browser storage (legacy)
- **Parameters:** None
- **Returns:** void
- **Notes:** Alternative method to `saveNewApiKey()`

### `clearApiKey()`
- **File:** tool.js (line 1308)
- **Purpose:** Remove all saved API keys and reset
- **Parameters:** None
- **Returns:** void
- **Notes:** Called when user wants to clear all keys

---

## 3. Image Management Functions

### `handleMultiImageUpload(e)`
- **File:** tool.js (line 361)
- **Purpose:** Process multiple image files selected by user
- **Parameters:** `e` (Event): File input change event
- **Returns:** void
- **Max Files:** Validates max 10 images
- **Max Size:** 20MB per image
- **Accepts:** JPG, PNG, WEBP
- **Side Effects:** Renders image list, updates capacity
- **Error Display:** Shows toast with error messages

### `renderImagesList()`
- **File:** tool.js (line 440)
- **Purpose:** Display all uploaded images with controls
- **Parameters:** None
- **Returns:** void
- **UI Element:** Updates `#imagesList` container
- **Features:** Shows thumbnails, size controls, copy buttons, remove

### `selectImage(id)`
- **File:** tool.js (line 489)
- **Purpose:** Select an image for editing/preview
- **Parameters:** `id` (string): Image object's unique ID
- **Returns:** void
- **Side Effects:** Updates selection UI, shows preview, loads edit controls

### `updateImageSize(id, size)`
- **File:** tool.js (line 539)
- **Purpose:** Change the print size of an image
- **Parameters:**
  - `id` (string): Image ID
  - `size` (string): Size code (e.g., '4x6', '2x2', custom)
- **Returns:** void
- **Sizes:** 4x6, 2x2, 1x1, 6x4, custom
- **Side Effects:** Updates capacity calculation, re-renders

### `updateImageCustomSize()`
- **File:** tool.js (line 577)
- **Purpose:** Set custom width/height for selected image
- **Parameters:** None (reads from input fields)
- **Returns:** void
- **Input Fields:** `#customWidth`, `#customHeight`
- **Validation:** Width/height must be > 0
- **Side Effects:** Updates capacity, re-renders

### `toggleImageAutoAdjust()`
- **File:** tool.js (line 620)
- **Purpose:** Toggle automatic size adjustment
- **Parameters:** None
- **Returns:** void
- **Notes:** If enabled, auto-adjusts image sizes to fit A4

### `updateImageCopies(id, delta)`
- **File:** tool.js (line 632)
- **Purpose:** Increase or decrease number of copies
- **Parameters:**
  - `id` (string): Image ID
  - `delta` (number): +1 or -1
- **Returns:** void
- **Min Copies:** 1
- **Max Copies:** 100
- **Side Effects:** Updates capacity, re-renders

### `removeImage(id)`
- **File:** tool.js (line 665)
- **Purpose:** Delete an image from the project
- **Parameters:** `id` (string): Image ID
- **Returns:** void
- **Side Effects:** Removes from array, updates capacity, re-renders

### `showImagePreview(imgObj)`
- **File:** tool.js (line 685)
- **Purpose:** Display detailed preview of selected image
- **Parameters:** `imgObj` (object): Image data object
- **Returns:** void
- **UI Element:** Shows `#imagePreview` container
- **Features:** Loads edit controls (brightness, contrast, hue, etc.)

### `clearImagePreview()`
- **File:** tool.js (line 723)
- **Purpose:** Hide the image preview panel
- **Parameters:** None
- **Returns:** void
- **UI Element:** Hides `#imagePreview` container

### `calculateTotalCapacity()`
- **File:** tool.js (line 326)
- **Purpose:** Calculate how many images fit on an A4 page
- **Parameters:** None
- **Returns:** number (total capacity)
- **Calculation:** Based on image sizes and copies

### `updateCapacity()`
- **File:** tool.js (line 336)
- **Purpose:** Recalculate capacity when images change
- **Parameters:** None
- **Returns:** void
- **Side Effects:** Calls `updateCapacityDisplay()`

### `updateCapacityDisplay()`
- **File:** tool.js (line 340)
- **Purpose:** Update UI with current capacity info
- **Parameters:** None
- **Returns:** void
- **UI Element:** Updates `#capacityInfo` container

### `calculateSizeCapacity(size)`
- **File:** tool.js (line 657)
- **Purpose:** Calculate how many images of a size fit on A4
- **Parameters:** `size` (string): Size code (e.g., '4x6')
- **Returns:** number (capacity for this size)

---

## 4. Canvas & Drawing Functions

### `drawBorder(ctx, x, y, w, h, thickness, color)`
- **File:** tool.js (line 291)
- **Purpose:** Draw rectangular border on canvas
- **Parameters:**
  - `ctx` (CanvasRenderingContext2D): Canvas context
  - `x, y, w, h` (numbers): Position and dimensions
  - `thickness` (number): Border line width
  - `color` (string): Border color
- **Returns:** void

### `drawBorderScaled(ctx, x, y, w, h, thickness, color, scale = 1)`
- **File:** tool.js (line 305)
- **Purpose:** Draw border with scaling factor
- **Parameters:** Same as `drawBorder` plus:
  - `scale` (number, default 1): Scale multiplier
- **Returns:** void

### `canvasToBlob(imgElement, type = 'image/png')`
- **File:** tool.js (line 1074)
- **Purpose:** Convert canvas or image to blob for API upload
- **Parameters:**
  - `imgElement` (HTMLImageElement): Image element
  - `type` (string): MIME type (default 'image/png')
- **Returns:** Promise<Blob>
- **Error Handling:** Validates image dimensions
- **Notes:** Handles PNG transparency preservation

### `isImageLikelyForeground(imgElement)`
- **File:** tool.js (line 1101)
- **Purpose:** Detect if image contains mainly foreground (not background)
- **Parameters:** `imgElement` (HTMLImageElement): Image to analyze
- **Returns:** boolean
- **Analysis:** Checks edge pixels for transparency patterns

### `getBlobFileName(blob, baseName)`
- **File:** tool.js (line 1149)
- **Purpose:** Generate filename for blob upload
- **Parameters:**
  - `blob` (Blob): Image blob
  - `baseName` (string): Base filename
- **Returns:** string (filename with timestamp)

---

## 5. Background Removal Functions

### `removeBackground()`
- **File:** tool.js (line 739)
- **Purpose:** Remove background from selected image using remove.bg API
- **Parameters:** None
- **Returns:** void
- **Process:**
  1. Gets selected image
  2. Checks API availability
  3. Sends to remove.bg API
  4. Processes result
  5. Updates image with transparent background
- **Status Messages:** Shows progress and errors
- **Logs:** Multiple logs for debugging API calls

### `processImageWithRemoveBg(imgObj, callback, retryCount = 0)`
- **File:** tool.js (line 833)
- **Purpose:** Handle background removal with retry logic
- **Parameters:**
  - `imgObj` (object): Image data object
  - `callback` (function): Called on completion
  - `retryCount` (number): Internal retry counter
- **Returns:** Promise<void>
- **Features:**
  - Automatic key switching on quota exhaustion
  - Up to 3 retry attempts
  - Product type fallback for detection errors
  - Detailed error handling

### `sendRemoveBgRequest(uploadBlob, uploadName, type = 'auto')`
- **File:** tool.js (line 1042)
- **Purpose:** Send image to remove.bg API
- **Parameters:**
  - `uploadBlob` (Blob): Image file to process
  - `uploadName` (string): Filename
  - `type` (string): Processing type ('auto', 'person', 'product')
- **Returns:** Promise<{result_b64: string}>
- **API:** Calls remove.bg v1.0 API
- **Logs:** 📤 remove.bg upload details

### `getRemoveBgErrorDetails(response)`
- **File:** tool.js (line 1029)
- **Purpose:** Parse error response from remove.bg API
- **Parameters:** `response` (Response): API response object
- **Returns:** Promise<{errors: Array, credits_remaining?: number}>
- **Errors Handled:** 402 (quota), 400 (invalid), 403 (unauthorized)

### `restoreBackground()`
- **File:** tool.js (line 1156)
- **Purpose:** Revert image to original (undo background removal)
- **Parameters:** None
- **Returns:** void
- **Side Effects:** Reloads original image, disables restore button

---

## 6. Image Editing Functions

### `setBgColor(color, el)`
- **File:** tool.js (line 1322)
- **Purpose:** Change background color for transparent images
- **Parameters:**
  - `color` (string): Hex color code
  - `el` (HTMLElement): Button element clicked
- **Returns:** void

### `setBgColorCustom(color)`
- **File:** tool.js (line 1329)
- **Purpose:** Set custom background color via color picker
- **Parameters:** `color` (string): Hex color code
- **Returns:** void

### `applyEdits()`
- **File:** tool.js (line 1338)
- **Purpose:** Render all edits to canvas
- **Parameters:** None
- **Returns:** void
- **Edits Applied:**
  - Brightness
  - Contrast
  - Hue/Saturation
  - Background color
  - Blur

### `resetEdits()`
- **File:** tool.js (line 1361)
- **Purpose:** Clear all edits and restore to original
- **Parameters:** None
- **Returns:** void
- **Side Effects:** Resets all sliders to defaults

### `adjustSlider(id, delta)`
- **File:** tool.js (line 1378)
- **Purpose:** Adjust slider value by increment
- **Parameters:**
  - `id` (string): Slider ID (e.g., 'brightSlider')
  - `delta` (number): +1 or -1
- **Returns:** void

### `showEditPreview()`
- **File:** tool.js (line 1395)
- **Purpose:** Show real-time preview of edits
- **Parameters:** None
- **Returns:** void
- **UI Element:** Shows `#editPreview` canvas

### `hideEditPreview()`
- **File:** tool.js (line 1406)
- **Purpose:** Hide edit preview
- **Parameters:** None
- **Returns:** void

### `updateEditPreview(imgObj)`
- **File:** tool.js (line 1411)
- **Purpose:** Render updated preview with current edit values
- **Parameters:** `imgObj` (object): Image data
- **Returns:** void

### `attachSliderListeners()`
- **File:** tool.js (line 1452)
- **Purpose:** Setup change listeners for edit sliders
- **Parameters:** None
- **Returns:** void
- **Notes:** Calls on page load

---

## 7. Print & Download Functions

### `doPrint()`
- **File:** tool.js (line 1707)
- **Purpose:** Print the A4 page(s) with all images
- **Parameters:** None
- **Returns:** void
- **Features:**
  - Uses browser print dialog
  - Optimized print styling
  - Multiple pages if needed
- **Print Settings:** A4 size, no margins

### `openNewPage()`
- **File:** tool.js (line 1792)
- **Purpose:** Create a new blank A4 page
- **Parameters:** None
- **Returns:** void
- **Side Effects:** Clears current images/layout

### `downloadImage()`
- **File:** tool.js (line 1871)
- **Purpose:** Download rendered A4 page as PNG
- **Parameters:** None
- **Returns:** void
- **Format:** PNG image
- **Quality:** High resolution
- **Naming:** photoprintpro_[timestamp].png

---

## 8. Crop Tool Functions

### `openCropModal()`
- **File:** tool.js (line 1942)
- **Purpose:** Open crop editor for selected image
- **Parameters:** None
- **Returns:** void
- **UI Element:** Shows `#cropModal`
- **Features:** Loads crop canvas with image

### `nextCropImage()`
- **File:** tool.js (line 2067)
- **Purpose:** Move to next image in crop mode
- **Parameters:** None
- **Returns:** void

### `prevCropImage()`
- **File:** tool.js (line 2072)
- **Purpose:** Move to previous image in crop mode
- **Parameters:** None
- **Returns:** void

### `applyCrop()`
- **File:** tool.js (line 2262)
- **Purpose:** Save crop and apply to image
- **Parameters:** None
- **Returns:** void
- **Side Effects:** Updates image, closes modal, re-renders

### `closeCropModal()`
- **File:** tool.js (line 2273)
- **Purpose:** Close crop editor without saving
- **Parameters:** None
- **Returns:** void
- **UI Element:** Hides `#cropModal`

---

## 9. Modal & UI Functions

### `isApiKeyConfigured()`
- **File:** tool.js (line 1176)
- **Purpose:** Check if any API key is set up
- **Parameters:** None
- **Returns:** boolean

---

## 📊 Function Statistics

- **Total Functions:** 79
- **API Key Management:** 13 functions
- **Image Management:** 13 functions
- **Canvas/Drawing:** 4 functions
- **Background Removal:** 4 functions
- **Image Editing:** 9 functions
- **Print/Download:** 3 functions
- **Crop Tool:** 5 functions
- **Modal/UI:** 3 functions
- **Utility:** 26 functions

---

## 🔗 Files Involved

- **tool.js** (Main application logic) - ~2300+ lines
- **tool.html** (UI structure) - ~500+ lines
- **styles.css** (Styling) - ~1000+ lines
- **shared.js** (Shared utilities)
- **index.html** (Home page)
- **contact.html** (Contact page)

---

## 📝 Variable Database

### Global Variables (in tool.js)

**Image Management:**
- `images` - Array of uploaded image objects
- `selectedImageId` - Currently selected image ID
- `currentCropImageIndex` - Index in crop mode

**API Keys:**
- `apiKeys` - Array of saved API keys
- `apiKeysList` - Full list with metadata
- `activeKeyId` - Currently active API key
- `removeBgApiKey` - Current API key in use

**Background Removal:**
- `freeBgRemovalsUsed` - Count of free removals
- `currentFreeKeyIndex` - Index of free API key
- `freeApiKeys` - Array of default free keys

**Canvas/A4:**
- `canvas` - Main A4 canvas element
- `ctx` - Canvas 2D context
- `a4Width` - A4 width (480px)
- `a4Height` - A4 height (679px)

**Edit State:**
- `currentEditState` - Current edit values
- `origImageData` - Original image before edits

---

## 🚀 Key Features by Function

### ✂️ Background Removal
- Multi-key support with auto-switching
- Free quota tracking
- Retry logic on errors
- Transparent PNG generation

### 📐 Layout System
- A4 page capacity calculation
- Automatic image arrangement
- Customizable sizes and copies
- Multi-page support

### ✏️ Image Editing
- Brightness/Contrast adjustment
- Hue/Saturation control
- Blur effect
- Background color change
- Real-time preview

### 🎨 UI/UX
- Responsive design
- Mobile-friendly
- Touch-optimized buttons
- Real-time validation

---

## 🛠️ Maintenance Notes

- All localStorage operations use prefix `ppp_`
- All API calls to remove.bg use v1.0 API
- A4 dimensions: 480x679px (96 DPI)
- Max file size per image: 20MB
- Supported formats: JPG, PNG, WEBP
- Max images per project: 10
- Console logs enabled for debugging

---

**Documentation Version:** 1.0
**Last Updated:** April 16, 2026
**Format:** Markdown
**Status:** Complete Reference
