# Скрипт для просмотра логов приложения на телефоне

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
    Write-Host "❌ ADB не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Просмотр логов Persona Messenger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Нажмите Ctrl+C для выхода" -ForegroundColor Yellow
Write-Host ""

# Очистка старых логов
& $adb logcat -c

# Просмотр логов приложения
& $adb logcat | Select-String -Pattern "persona|Persona|chromium|WebView" -Context 0,1
