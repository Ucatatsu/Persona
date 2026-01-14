# Скрипты для разработки Квант v2.0

## Быстрый старт

### Windows (рекомендуется)

**Вариант 1: CMD (самый простой)**
```cmd
start-dev.bat
```

**Вариант 2: PowerShell**
```powershell
.\start-dev-simple.ps1
```

**Вариант 3: Makefile**
```bash
make dev-backend    # В первом терминале
make dev-frontend   # Во втором терминале
```

---

## Описание скриптов

### `start-dev.bat` (CMD)
- ✅ Самый простой и надёжный способ
- Запускает бэкенд и фронтенд в отдельных окнах CMD
- Автоматически устанавливает кодировку UTF-8
- Показывает адреса серверов

**Использование:**
```cmd
start-dev.bat
```

### `start-dev-simple.ps1` (PowerShell)
- Запускает серверы в отдельных окнах PowerShell
- Цветной вывод
- Показывает статус запуска

**Использование:**
```powershell
.\start-dev-simple.ps1
```

### `start-dev.ps1` (PowerShell Advanced)
- Запускает серверы как фоновые задачи (Jobs)
- Объединённый вывод логов в одном окне
- Автоматическая остановка при Ctrl+C
- Проверка зависимостей

**Использование:**
```powershell
.\start-dev.ps1
```

---

## Адреса серверов

После запуска серверы будут доступны по адресам:

- **Бэкенд (Go):** http://localhost:8080
- **Фронтенд (Vite + React):** http://localhost:5173

---

## Остановка серверов

### CMD версия (`start-dev.bat`)
Закройте окна CMD с серверами

### PowerShell версии
- `start-dev-simple.ps1`: Закройте окна PowerShell
- `start-dev.ps1`: Нажмите `Ctrl+C` в основном окне

---

## Требования

- **Go** 1.21+ (для бэкенда)
- **Node.js** 18+ (для фронтенда)
- **npm** или **yarn**

### Проверка установки

```bash
go version
node --version
npm --version
```

---

## Первый запуск

При первом запуске автоматически установятся зависимости:

1. Go модули (backend)
2. npm пакеты (frontend)

Это может занять несколько минут.

---

## Troubleshooting

### Ошибка "go: command not found"
Установите Go с https://golang.org/dl/

### Ошибка "node: command not found"
Установите Node.js с https://nodejs.org/

### Порт уже занят
Если порт 8080 или 5173 занят, измените в:
- Бэкенд: `backend/.env` → `PORT=8080`
- Фронтенд: `frontend/vite.config.ts` → `server.port`

### PowerShell не запускает скрипты
Разрешите выполнение скриптов:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Makefile команды

```bash
make help          # Показать все команды
make install       # Установить зависимости
make dev-backend   # Запустить только бэкенд
make dev-frontend  # Запустить только фронтенд
make build         # Собрать проект для продакшена
make clean         # Очистить временные файлы
make test          # Запустить тесты
make lint          # Проверить код
```

---

## Рекомендации

1. **Для ежедневной разработки:** используйте `start-dev.bat`
2. **Для отладки:** используйте `make dev-backend` и `make dev-frontend` в разных терминалах
3. **Для CI/CD:** используйте `make build` и `make test`

---

## Структура проекта

```
kvant/
├── backend/           # Go бэкенд
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   └── go.mod
├── frontend/          # React фронтенд
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── start-dev.bat      # CMD скрипт
├── start-dev-simple.ps1  # PowerShell скрипт (простой)
├── start-dev.ps1      # PowerShell скрипт (продвинутый)
└── Makefile           # Make команды
```
