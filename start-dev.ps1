# Скрипт для запуска бэкенда и фронтенда одновременно
# Использование: .\start-dev.ps1

Write-Host "🚀 Запуск Квант в режиме разработки..." -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Go
try {
    $goVersion = go version
    Write-Host "✓ Go найден: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Go не найден! Установите Go с https://golang.org/dl/" -ForegroundColor Red
    exit 1
}

# Проверка наличия Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js найден: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js не найден! Установите Node.js с https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Проверка зависимостей..." -ForegroundColor Yellow

# Проверка зависимостей фронтенда
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📥 Установка зависимостей фронтенда..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "🔧 Запуск серверов..." -ForegroundColor Cyan
Write-Host ""

# Функция для запуска бэкенда
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    Write-Host "🟢 Бэкенд запускается на http://localhost:8080" -ForegroundColor Green
    go run cmd/server/main.go
}

# Функция для запуска фронтенда
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    Write-Host "🟦 Фронтенд запускается на http://localhost:5173" -ForegroundColor Blue
    npm run dev
}

Write-Host "🟢 Бэкенд запущен (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "🟦 Фронтенд запущен (Job ID: $($frontendJob.Id))" -ForegroundColor Blue
Write-Host ""
Write-Host "📝 Логи серверов:" -ForegroundColor Yellow
Write-Host "   Бэкенд:  Receive-Job $($backendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "   Фронтенд: Receive-Job $($frontendJob.Id) -Keep" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Нажмите Ctrl+C для остановки всех серверов" -ForegroundColor Yellow
Write-Host ""

# Ожидание и вывод логов
try {
    while ($true) {
        # Вывод логов бэкенда
        $backendOutput = Receive-Job $backendJob
        if ($backendOutput) {
            Write-Host "[BACKEND] " -ForegroundColor Green -NoNewline
            Write-Host $backendOutput
        }

        # Вывод логов фронтенда
        $frontendOutput = Receive-Job $frontendJob
        if ($frontendOutput) {
            Write-Host "[FRONTEND] " -ForegroundColor Blue -NoNewline
            Write-Host $frontendOutput
        }

        Start-Sleep -Milliseconds 100
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Остановка серверов..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "✓ Серверы остановлены" -ForegroundColor Green
}
