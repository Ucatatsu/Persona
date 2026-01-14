# Простой скрипт для запуска бэкенда и фронтенда в отдельных окнах
# Использование: .\start-dev-simple.ps1

Write-Host "🚀 Запуск Квант в режиме разработки..." -ForegroundColor Cyan
Write-Host ""

# Запуск бэкенда в новом окне PowerShell
Write-Host "🟢 Запуск бэкенда..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host '🟢 Бэкенд сервер - http://localhost:8080' -ForegroundColor Green; go run cmd/server/main.go"

# Небольшая задержка
Start-Sleep -Seconds 2

# Запуск фронтенда в новом окне PowerShell
Write-Host "🟦 Запуск фронтенда..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host '🟦 Фронтенд сервер - http://localhost:5173' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "✓ Серверы запущены в отдельных окнах!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Адреса:" -ForegroundColor Yellow
Write-Host "   Бэкенд:   http://localhost:8080" -ForegroundColor Gray
Write-Host "   Фронтенд: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Закройте окна PowerShell для остановки серверов" -ForegroundColor Yellow
