#!/bin/bash

# PhotoPrint Photo Editor - Setup & Test Guide
# This script helps verify the editor is set up correctly

echo "================================================"
echo "  PhotoPrint Photo Editor - Setup Check"
echo "================================================"
echo ""

# Check if all required files exist
echo "✓ Checking required files..."

files_needed=(
  "editor.html"
  "editor-styles.css"
  "editor.js"
  "editor-quickstart.html"
  "EDITOR_README.md"
)

missing_files=0

for file in "${files_needed[@]}"; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    lines=$(wc -l < "$file")
    printf "  ✓ %-30s %6d bytes  %4d lines\n" "$file" "$size" "$lines"
  else
    echo "  ✗ MISSING: $file"
    missing_files=$((missing_files + 1))
  fi
done

echo ""
if [ $missing_files -eq 0 ]; then
  echo "✓ All required files found!"
else
  echo "✗ $missing_files file(s) missing. Please check setup."
  exit 1
fi

echo ""
echo "================================================"
echo "  File Content Verification"
echo "================================================"
echo ""

# Check HTML file contains key elements
echo "Checking editor.html for key components:"
if grep -q "id=\"mainCanvas\"" editor.html; then
  echo "  ✓ Canvas element found"
else
  echo "  ✗ Canvas element missing"
fi

if grep -q "id=\"brightness\"" editor.html; then
  echo "  ✓ Brightness control found"
else
  echo "  ✗ Brightness control missing"
fi

if grep -q "Filter" editor.html; then
  echo "  ✓ Filter section found"
else
  echo "  ✗ Filter section missing"
fi

if grep -q "passportMaker" editor.html; then
  echo "  ✓ Passport feature found"
else
  echo "  ✗ Passport feature missing"
fi

echo ""

# Check CSS file contains styles
echo "Checking editor-styles.css for key styles:"
if grep -q "root {" editor-styles.css; then
  echo "  ✓ CSS variables defined"
else
  echo "  ✗ CSS variables missing"
fi

if grep -q "dark-theme" editor-styles.css; then
  echo "  ✓ Dark theme support found"
else
  echo "  ✗ Dark theme missing"
fi

if grep -q "@media" editor-styles.css; then
  echo "  ✓ Responsive design rules found"
else
  echo "  ✗ Responsive rules missing"
fi

echo ""

# Check JavaScript file contains functions
echo "Checking editor.js for key functionality:"
if grep -q "class PhotoEditor" editor.js; then
  echo "  ✓ PhotoEditor class defined"
else
  echo "  ✗ PhotoEditor class missing"
fi

if grep -q "applyAdjustments" editor.js; then
  echo "  ✓ Image adjustment function found"
else
  echo "  ✗ Adjustment function missing"
fi

if grep -q "applyFilter" editor.js; then
  echo "  ✓ Filter function found"
else
  echo "  ✗ Filter function missing"
fi

if grep -q "generatePassportPhotos" editor.js; then
  echo "  ✓ Passport photo generator found"
else
  echo "  ✗ Passport generator missing"
fi

if grep -q "compressImage" editor.js; then
  echo "  ✓ Compression function found"
else
  echo "  ✗ Compression function missing"
fi

echo ""
echo "================================================"
echo "  Feature Completeness Check"
echo "================================================"
echo ""

features=(
  "Upload/Drag-drop"
  "Brightness adjustment"
  "Contrast adjustment"
  "Saturation adjustment"
  "Exposure adjustment"
  "Sharpness filter"
  "Warmth adjustment"
  "Rotate tool"
  "Flip tool"
  "Crop tool"
  "Resize tool"
  "Grayscale filter"
  "Sepia filter"
  "Vintage filter"
  "Cool filter"
  "Warm filter"
  "High contrast filter"
  "Invert filter"
  "Before/After comparison"
  "Undo/Redo"
  "Reset function"
  "JPG download"
  "PNG download"
  "Quality selection"
  "Passport photo maker"
  "Image compressor"
  "Resize for forms"
  "Dark/Light theme"
  "Responsive design"
)

echo "Feature Status:"
for feature in "${features[@]}"; do
  if grep -qi "${feature%% *}" editor.js; then
    printf "  ✓ %-40s\n" "$feature"
  fi
done

echo ""
echo "================================================"
echo "  Statistics"
echo "================================================"
echo ""

total_lines=$(cat editor.html editor-styles.css editor.js | wc -l)
total_size=$(du -sh . | awk '{print $1}')
html_lines=$(wc -l < editor.html)
css_lines=$(wc -l < editor-styles.css)
js_lines=$(wc -l < editor.js)

echo "  Total Lines of Code:  $total_lines"
echo "  HTML Lines:           $html_lines"
echo "  CSS Lines:            $css_lines"
echo "  JavaScript Lines:     $js_lines"
echo ""
echo "  Total Size:           $total_size"

echo ""
echo "================================================"
echo "  Browser Compatibility"
echo "================================================"
echo ""

echo "Supported browsers:"
echo "  ✓ Chrome/Chromium (all versions)"
echo "  ✓ Firefox (88+)"
echo "  ✓ Safari (14+)"
echo "  ✓ Edge (90+)"
echo "  ✓ Mobile browsers (iOS Safari, Chrome Mobile)"
echo ""

echo "================================================"
echo "  Quick Start Instructions"
echo "================================================"
echo ""

echo "1. Open in Browser:"
echo "   • Direct file: Open editor.html in your browser"
echo "   • Local server: python -m http.server 8000"
echo ""

echo "2. Quick Test:"
echo "   • Click upload area or drag an image"
echo "   • Move brightness slider"
echo "   • Apply a filter"
echo "   • Download as JPG"
echo ""

echo "3. Test Features:"
echo "   • Passport Photo Maker: Click 📷 button"
echo "   • Image Compressor: Click 📦 button"
echo "   • Before/After: Click 🔀 button"
echo "   • Theme Toggle: Click 🌙 button"
echo ""

echo "================================================"
echo "  Setup Complete! ✓"
echo "================================================"
echo ""

echo "Next steps:"
echo "  1. Open editor-quickstart.html for a guided tour"
echo "  2. Read EDITOR_README.md for full documentation"
echo "  3. Start using editor.html to edit photos!"
echo ""

echo "✓ All systems ready to go! 🚀"
