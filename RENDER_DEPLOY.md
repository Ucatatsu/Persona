# Деплой на Render

## Текущее состояние
- Backend: https://persona-backend-o96b.onrender.com ✅
- Frontend: https://persona-client-kcnt.onrender.com ❌ (нужно обновить)

## Проблема
Фронтенд на Render не обновлен после исправления WebSocket URL. Он все еще пытается подключиться к localhost.

## Решение

### Вариант 1: Автоматический деплой через Git (рекомендуется)

1. Закоммитить изменения:
```bash
git add .
git commit -m "Fix WebSocket URL to use environment variable"
git push
```

2. Render автоматически задеплоит новую версию (если настроен auto-deploy)

### Вариант 2: Ручной деплой через Render Dashboard

1. Зайти на https://dashboard.render.com
2. Найти сервис `persona-client-kcnt`
3. Нажать "Manual Deploy" → "Deploy latest commit"
4. Дождаться завершения деплоя

### Вариант 3: Локальная сборка и загрузка

Если у вас Static Site на Render:

1. Собрать проект локально:
```bash
cd client
npm run build
```

2. Загрузить содержимое папки `client/dist` на Render через Dashboard

## Настройки Render для фронтенда

### Static Site настройки:
- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://persona-backend-o96b.onrender.com`
  - `VITE_WS_URL`: `wss://persona-backend-o96b.onrender.com`

### Web Service настройки (если используется Docker):
- **Build Command**: `docker build -f client/Dockerfile -t persona-client .`
- **Start Command**: `nginx -g 'daemon off;'`
- **Environment Variables**: те же

## Проверка после деплоя

1. Открыть https://persona-client-kcnt.onrender.com
2. Открыть DevTools (F12) → Console
3. Проверить, что WebSocket подключается к `wss://persona-backend-o96b.onrender.com/api/ws`
4. Не должно быть ошибок про localhost

## Важно!

После деплоя фронтенда нужно:
1. Очистить кэш браузера (Ctrl+Shift+Delete)
2. Перезагрузить страницу с очисткой кэша (Ctrl+F5)
3. Проверить, что используется новая версия

## Файлы с изменениями

Измененные файлы, которые нужно задеплоить:
- `client/src/services/websocket.ts` - использует VITE_WS_URL
- `client/.env` - правильные URL
- `client/dist/*` - собранные файлы (после npm run build)

## Дата
28 февраля 2026
