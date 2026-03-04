# TitlePerfect Extension Build Script
# Builds the extension and copies necessary files to dist/

Write-Host "Building TitlePerfect extension..." -ForegroundColor Cyan

# Run the build
npm run build

# Copy manifest
copy manifest.json dist\

# Create icons directory and copy icons
mkdir dist\icons -ErrorAction SilentlyContinue
copy icons\* dist\icons\

Write-Host "Build complete! Refresh extension in Chrome." -ForegroundColor Green
