# Исправление WebSocket подключения

## Проблема
При открытии приложения в консоли появлялись ошибки:
- WebSocket пытался подключиться к `ws://localhost:8080` вместо правильного URL
- 401 ошибка от неправильного домена

## Причина
В файле `client/src/services/websocket.ts` был захардкожен URL:
```typescript
const wsUrl = `ws://localhost:8080/api/ws?token=${token}`
```

## Решение
Изменено на использование переменной окружения:
```typescript
const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/api/ws?token=${token}`
```

Теперь WebSocket использует URL из `.env` файла:
```
VITE_WS_URL=wss://persona-backend-o96b.onrender.com
```

## Файл APK
`Persona-FIXED-WEBSOCKET.apk` (4.73 MB)

## Что включено
✅ Кастомная иконка Persona  
✅ Автоматический вход после регистрации  
✅ Правильный WebSocket URL (wss://persona-backend-o96b.onrender.com)  
✅ Правильный API URL (https://persona-backend-o96b.onrender.com)  
✅ Оптимизации производительности

## Измененные файлы
- `client/src/services/websocket.ts` - использует VITE_WS_URL
- `client/.env` - содержит правильные URL
- `build-android-with-icons.ps1` - обновлен список изменений

## Тестирование
1. Установить APK на устройство
2. Зарегистрироваться или войти
3. Проверить консоль браузера (через Chrome DevTools для Android)
4. WebSocket должен подключаться к `wss://persona-backend-o96b.onrender.com/api/ws`

## Дата исправления
28 февраля 2026, 18:45
