# Быстрая инструкция по деплою

## ✅ Что сделано
- Исправлена ошибка `ReferenceError: Cannot access 'cr'`
- Исправлен WebSocket URL
- Код запушен на GitHub

## 🚀 Что нужно сделать СЕЙЧАС

### 1. Зайти на Render
https://dashboard.render.com

### 2. Найти сервис
Найдите `persona-client-kcnt` в списке

### 3. Проверить настройки

**Settings → Build & Deploy:**
- Build Command: `cd client && npm install && npm run build`
- Publish Directory: `client/dist`

**Settings → Environment:**
- `VITE_API_URL` = `https://persona-backend-o96b.onrender.com`
- `VITE_WS_URL` = `wss://persona-backend-o96b.onrender.com`

### 4. Задеплоить

Нажмите **"Manual Deploy"** → **"Deploy latest commit"**

Подождите 2-5 минут.

### 5. Проверить

Откройте: https://persona-client-kcnt.onrender.com

Нажмите F12 → Console → Обновите страницу (Ctrl+F5)

**Должно быть:**
- ✅ Сайт загружается
- ✅ Нет ошибок в консоли
- ✅ WebSocket подключается

**Не должно быть:**
- ❌ Ошибок про localhost
- ❌ ReferenceError
- ❌ Черного экрана

### 6. Очистить кэш

Ctrl+Shift+Delete → Clear data → Ctrl+F5

---

## 📝 Полная инструкция
См. файл `RENDER_DEPLOY_STEPS.md`

## 🆘 Проблемы?
1. Проверьте логи в Render Dashboard → Logs
2. Убедитесь, что переменные окружения установлены
3. Попробуйте Manual Deploy еще раз
