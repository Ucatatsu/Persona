# Обновление иконки приложения

## Что было сделано

### 1. Генерация иконок Android
Создан скрипт `generate-android-icons.ps1`, который автоматически генерирует иконки для всех разрешений Android из `logo.png`:

- **mipmap-mdpi**: 48x48 px
- **mipmap-hdpi**: 72x72 px
- **mipmap-xhdpi**: 96x96 px
- **mipmap-xxhdpi**: 144x144 px
- **mipmap-xxxhdpi**: 192x192 px

Для каждого разрешения создаются три файла:
- `ic_launcher.png` - основная иконка
- `ic_launcher_round.png` - круглая иконка
- `ic_launcher_foreground.png` - передний план иконки

### 2. Автоматизированная сборка
Создан скрипт `build-android-with-icons.ps1`, который выполняет полный цикл сборки:

1. Генерирует иконки Android из logo.png
2. Копирует logo.png в client/public/ для веб-версии
3. Собирает веб-приложение (npm run build)
4. Синхронизирует с Capacitor (npx cap sync android)
5. Собирает APK с Java 17
6. Копирует готовый APK в корень проекта

### 3. Результат
Создан файл `Persona-with-icons.apk` (7.18 MB) с:
- ✅ Кастомной иконкой Persona
- ✅ Автоматическим входом после регистрации (фикс черного экрана)
- ✅ Правильным URL бэкенда: https://persona-backend-o96b.onrender.com

## Как использовать

### Пересборка APK с иконками
```powershell
.\build-android-with-icons.ps1
```

### Только генерация иконок (без сборки)
```powershell
.\generate-android-icons.ps1
```

## Исходные файлы
- `logo.png` - исходная иконка в корне проекта (321 KB)
- `logo.svg` - векторная версия логотипа
- `client/src/components/Logo.tsx` - React компонент с SVG логотипом

## Технические детали
- Иконки генерируются с использованием System.Drawing (.NET)
- Используется высококачественный алгоритм ресайза (HighQualityBicubic)
- Все иконки сохраняются в формате PNG
- Скрипт автоматически создает необходимые папки, если их нет

## Дата обновления
28 февраля 2026
