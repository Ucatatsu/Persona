# Тестирование фонов локально

## 🧪 Как протестировать

### 1. Запустите фронтенд локально

```powershell
cd client
npm run dev
```

Откройте: http://localhost:5173

### 2. Откройте консоль (F12)

### 3. Попробуйте выбрать фон

Вы должны увидеть логи:
```
=== PRESET CLICKED ===
Preset: Аврора gradient-2
setBackground called
=== setBackground called ===
Type: preset PresetId: gradient-2 CustomUrl: none
=== applyBackground called ===
Type: preset PresetId: gradient-2 CustomUrl: none
Is light theme: false
Applying preset: gradient-2
Preset found: Аврора linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%...
Background applied successfully
```

### 4. Проверьте, что фон изменился

Если фон не меняется, проверьте:

1. **Инспектор элементов** (F12 → Elements)
2. Найдите `<body>` элемент
3. Посмотрите на стили - должно быть:
   ```css
   background: linear-gradient(...) !important;
   ```

## 🔍 Возможные проблемы

### Проблема 1: Фон перезаписывается другими стилями

**Решение:** Проверьте, нет ли других стилей с `!important` для body.

### Проблема 2: Фон применяется, но не виден

**Причина:** Другие элементы перекрывают фон.

**Решение:** Проверьте z-index и прозрачность элементов.

### Проблема 3: Логи не появляются

**Причина:** Старая версия кода в браузере.

**Решение:** 
1. Очистите кэш (Ctrl+Shift+Delete)
2. Перезагрузите страницу (Ctrl+F5)

## 📦 Деплой на продакшен

После того как убедитесь, что локально работает:

### Netlify

```powershell
# Если используете Netlify CLI
netlify deploy --prod --dir=client/dist
```

Или через Git:
```powershell
git add .
git commit -m "fix: исправлены фоны"
git push origin main
```

Netlify автоматически задеплоит, если настроен автодеплой.

### Vercel

```powershell
# Если используете Vercel CLI
vercel --prod
```

Или через Git - Vercel автоматически задеплоит.

### Вручную

1. Скопируйте содержимое `client/dist/`
2. Загрузите на ваш хостинг
3. Убедитесь, что `_redirects` файл на месте

## ✅ Проверка на продакшене

После деплоя:

1. Откройте ваш сайт
2. Очистите кэш (Ctrl+Shift+Delete)
3. Перезагрузите (Ctrl+F5)
4. Попробуйте выбрать фон
5. Проверьте логи в консоли

## 🆘 Если не работает

Отправьте мне:
1. Скриншот консоли с логами
2. Скриншот инспектора элементов (body стили)
3. URL вашего сайта
