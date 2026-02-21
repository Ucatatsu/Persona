# 📱💻 Создание приложений для Persona

## Обзор

Этот документ описывает процесс создания нативных приложений для ПК (Windows/Mac/Linux) и Android для Persona Messenger.

---

## 🎯 Рекомендуемые подходы

### Для Android: Capacitor
- ✅ Использует существующий React код
- ✅ Быстрая настройка (15-20 минут)
- ✅ Автообновление контента с сервера
- ✅ Доступ к нативным API (камера, уведомления, файлы)

### Для ПК: Electron
- ✅ Кроссплатформенность (Windows, Mac, Linux)
- ✅ Использует существующий React код
- ✅ Нативные функции (трей, уведомления, автозапуск)
- ✅ Автообновления через electron-updater

---

## 📋 Требования

### Для Android (APK):
- **Node.js** 18+ (уже установлен)
- **Android Studio** (скачать с https://developer.android.com/studio)
- **Java JDK** 11+ (обычно идёт с Android Studio)
- **Android SDK** (устанавливается через Android Studio)

### Для ПК (Electron):
- **Node.js** 18+ (уже установлен)
- Для сборки Windows EXE: любая ОС
- Для сборки Mac DMG: нужен macOS
- Для сборки Linux: любая ОС

---

## � Создание приложения для ПК (Electron)

### Шаг 1: Установка Electron

```bash
cd client

# Установить Electron и зависимости
npm install --save-dev electron electron-builder
npm install --save-dev concurrently wait-on
```

### Шаг 2: Создать главный файл Electron

Создайте файл `electron/main.js`:

```javascript
const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    autoHideMenuBar: true,
    backgroundColor: '#1e293b'
  })

  // Загрузить приложение
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Минимизировать в трей вместо закрытия
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/icon.png'))
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: 'Выход',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('Persona Messenger')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

### Шаг 3: Настроить package.json

Добавьте в `client/package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.persona.messenger",
    "productName": "Persona",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "public/icon.png"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "public/icon.png",
      "category": "public.app-category.social-networking"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "public/icon.png",
      "category": "Network"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### Шаг 4: Запустить в режиме разработки

```bash
npm run electron:dev
```

### Шаг 5: Собрать установщик

```bash
# Для Windows
npm run electron:build:win

# Для Mac (только на macOS)
npm run electron:build:mac

# Для Linux
npm run electron:build:linux

# Для всех платформ
npm run electron:build
```

Готовые установщики будут в папке `client/release/`

---

## 📱 Создание Android APK (Capacitor)

### Шаг 1: Установка зависимостей

```bash
cd client

# Установить Capacitor
npm install @capacitor/core @capacitor/cli

# Установить Android платформу
npm install @capacitor/android
```

### Шаг 2: Инициализация Capacitor

```bash
# Инициализировать Capacitor
npx cap init

# Вас спросят:
# App name: Persona
# App ID: com.persona.messenger
# Web asset directory: dist
```

### Шаг 3: Настройка конфигурации

Создайте файл `capacitor.config.ts` в папке `client/`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.persona.messenger',
  appName: 'Persona',
  webDir: 'dist',
  server: {
    // Для разработки - загружать с локального сервера
    // url: 'http://localhost:5173',
    // cleartext: true,
    
    // Для продакшена - использовать встроенные файлы
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b",
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

---

## 📱 Создание Android APK

### Шаг 1: Собрать React приложение

```bash
cd client
npm run build
```

### Шаг 2: Добавить Android платформу

```bash
npx cap add android
```

Это создаст папку `android/` с нативным проектом.

### Шаг 3: Синхронизировать код

```bash
npx cap sync android
```

### Шаг 4: Открыть в Android Studio

```bash
npx cap open android
```

### Шаг 5: Собрать APK в Android Studio

1. Дождитесь завершения Gradle Sync
2. Меню: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. После сборки нажмите **locate** чтобы найти APK
4. APK будет в `android/app/build/outputs/apk/debug/app-debug.apk`

### Шаг 6: Подписать APK для релиза (опционально)

Для публикации в Google Play нужен подписанный APK:

```bash
# Создать keystore
keytool -genkey -v -keystore persona-release-key.keystore -alias persona -keyalg RSA -keysize 2048 -validity 10000

# В Android Studio:
# Build → Generate Signed Bundle / APK → APK
# Выбрать keystore и ввести пароли
```

---

## 🔄 Автообновления

### Для Electron (electron-updater)

```bash
npm install electron-updater
```

Добавьте в `electron/main.js`:

```javascript
const { autoUpdater } = require('electron-updater')

app.whenReady().then(() => {
  createWindow()
  createTray()
  
  // Проверять обновления при запуске
  autoUpdater.checkForUpdatesAndNotify()
})
```

### Для Android

Capacitor автоматически загружает контент с сервера, если настроен `server.url`.
Для обновления нативной части нужно пересобрать APK.

---

## 🔧 Полезные плагины Capacitor

### Push уведомления

```bash
npm install @capacitor/push-notifications
```

### Камера

```bash
npm install @capacitor/camera
```

### Файловая система

```bash
npm install @capacitor/filesystem
```

### Статус бар

```bash
npm install @capacitor/status-bar
```

### Клавиатура

```bash
npm install @capacitor/keyboard
```

---

## 🔄 Процесс разработки

### Режим разработки (Live Reload)

1. Запустить dev сервер:
```bash
cd client
npm run dev
```

2. Изменить `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.100:5173',  // Ваш локальный IP
  cleartext: true
}
```

3. Синхронизировать:
```bash
npx cap sync
```

4. Запустить приложение - оно будет загружать контент с dev сервера

### Режим продакшена

1. Собрать приложение:
```bash
npm run build
```

2. Убрать `server.url` из `capacitor.config.ts`

3. Синхронизировать:
```bash
npx cap sync
```

4. Собрать APK/IPA

---

## 📦 Обновление приложения

### Обновление кода

После изменений в React коде:

```bash
# 1. Собрать
npm run build

# 2. Синхронизировать
npx cap sync

# 3. Пересобрать APK в Android Studio
```

### Автообновление контента

Если используете режим с загрузкой с сервера:
- Изменения на сайте автоматически появятся в приложении
- Не нужно пересобирать APK
- Обновлять APK нужно только для:
  - Изменения нативных функций
  - Обновления иконки/названия
  - Обновления Capacitor плагинов

---

## 🎨 Настройка иконки и splash screen

### Иконка приложения

1. Создать иконку 1024x1024px
2. Использовать генератор: https://icon.kitchen/
3. Скачать и заменить файлы в:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Splash Screen

1. Создать изображение 2732x2732px
2. Заменить:
   - `android/app/src/main/res/drawable/splash.png`
   - `ios/App/App/Assets.xcassets/Splash.imageset/splash.png`

---

## 🐛 Частые проблемы

### Android Studio не видит устройство

```bash
# Включить USB отладку на телефоне
# Настройки → О телефоне → 7 раз нажать на "Номер сборки"
# Настройки → Для разработчиков → USB отладка
```

### Gradle ошибки

```bash
# Очистить кэш
cd android
./gradlew clean

# Или в Android Studio:
# Build → Clean Project
# Build → Rebuild Project
```

### Белый экран при запуске

Проверить:
1. `npm run build` выполнен
2. `npx cap sync` выполнен
3. `webDir: 'dist'` правильно указан в `capacitor.config.ts`

### Ошибки CORS

Если приложение загружает контент с сервера, убедитесь что CORS настроен:

```go
// В Go backend
cors.AllowOrigins = []string{
    "http://localhost:5173",
    "capacitor://localhost",  // Для Capacitor
    "ionic://localhost",
}
```

---

## 📊 Размер приложения

- **Базовый APK**: ~10-15 MB
- **С React кодом**: ~15-20 MB
- **С изображениями**: зависит от контента

Для уменьшения размера:
- Оптимизировать изображения
- Использовать ProGuard (Android)
- Включить code splitting в Vite

---

## 🚀 Публикация

### Google Play Store (Android)

1. Создать аккаунт разработчика ($25 один раз)
2. Создать приложение в консоли
3. Загрузить подписанный APK/AAB
4. Заполнить описание, скриншоты
5. Отправить на проверку

### Распространение ПК приложения

**Варианты:**
1. **Прямая загрузка** - разместить EXE/DMG на сайте
2. **GitHub Releases** - автоматические обновления через electron-updater
3. **Microsoft Store** - для Windows (требует сертификат)
4. **Snap Store** - для Linux
5. **Homebrew** - для macOS

---

## 📝 Чеклист перед релизом

### Android:
- [ ] Собрать production build (`npm run build`)
- [ ] Проверить все функции на реальном устройстве
- [ ] Настроить иконку и splash screen
- [ ] Подписать APK
- [ ] Протестировать установку
- [ ] Проверить размер приложения
- [ ] Подготовить скриншоты для Google Play
- [ ] Написать описание приложения

### ПК (Electron):
- [ ] Собрать production build
- [ ] Протестировать на Windows
- [ ] Протестировать на Linux (если нужно)
- [ ] Настроить иконку приложения
- [ ] Настроить автообновления
- [ ] Проверить размер установщика
- [ ] Подписать EXE (опционально, для Windows)
- [ ] Создать инструкцию по установке

---

## 🔗 Полезные ссылки

### Android:
- Capacitor документация: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Icon Kitchen: https://icon.kitchen/
- Google Play Console: https://play.google.com/console

### Electron:
- Electron документация: https://www.electronjs.org/docs
- Electron Builder: https://www.electron.build/
- Electron Updater: https://www.electron.build/auto-update

---

## 💡 Советы

### Для Android:
1. **Тестируйте на реальных устройствах** - эмуляторы не всегда точны
2. **Используйте Live Reload** - ускоряет разработку
3. **Следите за размером** - пользователи не любят большие приложения
4. **Читайте логи** - `npx cap run android -l` показывает логи в реальном времени

### Для Electron:
1. **Начните с разработки** - `npm run electron:dev` для быстрой итерации
2. **Оптимизируйте размер** - используйте `asar` архивы
3. **Тестируйте установщики** - проверяйте на чистой системе
4. **Настройте автообновления** - пользователи оценят
5. **Добавьте трей** - удобно для мессенджера

---

Создано: 21.02.2026
Версия: 1.0
