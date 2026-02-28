# Build Android APK with custom icons and auto-login fix
# This script generates icons, builds the web app, syncs with Android, and builds APK

Write-Host "=== Building Persona Android APK ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate Android icons
Write-Host "Step 1: Generating Android icons..." -ForegroundColor Yellow
.\generate-android-icons.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate icons!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Copy logo to public folder
Write-Host "Step 2: Copying logo to public folder..." -ForegroundColor Yellow
Copy-Item logo.png client\public\logo.png -Force
Write-Host "Logo copied successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Build web app
Write-Host "Step 3: Building web application..." -ForegroundColor Yellow
Set-Location client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "Web app built successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Sync with Capacitor
Write-Host "Step 4: Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Capacitor sync failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "Capacitor sync completed!" -ForegroundColor Green
Write-Host ""

# Step 5: Build APK
Write-Host "Step 5: Building Android APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}
Set-Location ..\..

# Step 6: Copy APK to root
Write-Host ""
Write-Host "Step 6: Copying APK to root folder..." -ForegroundColor Yellow
$apkSource = "client\android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "Persona-with-icons.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    $apkSize = (Get-Item $apkDest).Length / 1MB
    Write-Host "APK copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== BUILD COMPLETE ===" -ForegroundColor Green
    Write-Host "APK Location: $apkDest" -ForegroundColor Cyan
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Changes included:" -ForegroundColor Yellow
    Write-Host "  - Custom Persona logo icons" -ForegroundColor White
    Write-Host "  - Auto-login after registration (fixes black screen)" -ForegroundColor White
    Write-Host "  - Fixed WebSocket URL (uses VITE_WS_URL from .env)" -ForegroundColor White
    Write-Host "  - Backend URL: https://persona-backend-o96b.onrender.com" -ForegroundColor White
} else {
    Write-Host "APK file not found at $apkSource" -ForegroundColor Red
    exit 1
}
