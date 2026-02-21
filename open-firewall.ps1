# Открыть порт 8080 в файрволе Windows для Persona Backend
# Запустить от имени администратора

Write-Host "Открываю порт 8080 в файрволе Windows..." -ForegroundColor Green

try {
    netsh advfirewall firewall add rule name="Persona Backend" dir=in action=allow protocol=TCP localport=8080
    Write-Host "✅ Порт 8080 успешно открыт!" -ForegroundColor Green
    Write-Host "Теперь телефон сможет подключиться к серверу" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    Write-Host "Запустите этот скрипт от имени администратора" -ForegroundColor Yellow
}

pause
