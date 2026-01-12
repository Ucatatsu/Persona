# Тест админ API
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = $response.token

Write-Host "Токен получен: $($token.Substring(0,50))..."

# Тест статистики
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/stats" -Method GET -Headers @{"Authorization"="Bearer $token"}
    Write-Host "Статистика:"
    $stats | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Ошибка статистики: $($_.Exception.Message)"
}

# Тест пользователей
try {
    $users = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Method GET -Headers @{"Authorization"="Bearer $token"}
    Write-Host "Пользователи:"
    $users | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Ошибка пользователей: $($_.Exception.Message)"
}