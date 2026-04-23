# PhotoPrint Wala

A fast passport photo tool for Indian photo shops. Create, edit, and print passport photos in seconds.

## Features

- 📸 Auto background removal with remove.bg API
- 🎨 Background color switching (white, light blue, grey, custom)
- 📐 5 ID photo sizes (Passport, Stamp, Aadhaar, PAN, Visa)
- 🖨️ Smart A4 layout with one-click printing
- ✂️ Crop tool with zoom and pan
- ⚙️ Brightness, contrast, and rotation controls

## Setup

### 1. Get a remove.bg API Key

1. Visit [remove.bg/api](https://www.remove.bg/api)
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Open the tool and paste your API key when prompted
5. The key is saved locally in your browser

### 2. File Structure

```
index.html       - Home page
tool.html        - Photo editing tool (main app)
premium.html     - Premium plans
contact.html     - Support & WhatsApp
styles.css       - All styling
shared.js        - Common functionality
tool.js          - Tool-specific features
```

## Usage

1. Open `index.html` in a browser
2. Click "Start Tool" to access the photo editor
3. Upload a photo
4. Use background removal (requires API key)
5. Choose background color
6. Adjust brightness, contrast, rotation
7. Select photo size and quantity
8. Print on A4

## API Integration

The tool uses the [remove.bg API](https://www.remove.bg/api) for background removal. 

**Free tier limits:**
- 50 API calls/month
- Standard resolution output
- Sufficient for testing and small operations

**Upgrade for higher limits:**
- 500-15,000 API calls/month
- Full resolution output
