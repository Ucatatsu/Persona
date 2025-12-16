const { app, BrowserWindow, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let serverReady = false;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

// Проверка готовности сервера
async function waitForServer(maxAttempts = 30) {
    const http = require('http');
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(SERVER_URL, (res) => {
                    resolve(res.statusCode);
                });
                req.on('error', reject);
                req.setTimeout(1000, () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return false;
}

// Запуск сервера
function startServer() {
    // SQLite работает без DATABASE_URL (локальная разработка)
    // PostgreSQL требует DATABASE_URL (продакшен)
    if (!process.env.DATABASE_URL) {
        console.log('📦 DATABASE_URL не установлен - используется SQLite (локальная БД)');
        process.env.USE_SQLITE = 'true';
    }
    
    // JWT_SECRET обязателен
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  JWT_SECRET не установлен - используется небезопасный дефолт');
    }
    
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    
    try {
        require('./server.js');
        console.log(`Сервер запускается на порту ${PORT}`);
        return true;
    } catch (error) {
        console.error('Ошибка запуска сервера:', error);
        dialog.showErrorBox('Ошибка запуска', `Не удалось запустить сервер:\n${error.message}`);
        app.quit();
        return false;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'public', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0a1628',
            symbolColor: '#4fc3f7',
            height: 40
        },
        show: false,
        backgroundColor: '#0a1628'
    });

    mainWindow.loadURL(SERVER_URL);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Внешние ссылки в браузере
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(SERVER_URL)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Сворачивание в трей
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Обработка ошибок загрузки
    mainWindow.webContents.on('did-fail-load', async () => {
        if (!serverReady) {
            mainWindow.loadFile(path.join(__dirname, 'public', 'loading.html'));
        }
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'public', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Открыть Квант', 
            click: () => mainWindow.show() 
        },
        { type: 'separator' },
        { 
            label: 'Выход', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Квант');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(async () => {
    // Запускаем сервер
    if (!startServer()) return;
    
    // Ждём готовности сервера
    serverReady = await waitForServer();
    
    if (!serverReady) {
        dialog.showErrorBox('Ошибка', 'Сервер не отвечает. Проверьте настройки базы данных.');
        app.quit();
        return;
    }
    
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

// Graceful shutdown
app.on('before-quit', () => {
    app.isQuitting = true;
});
