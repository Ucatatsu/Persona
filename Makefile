# Квант v2.0 - Makefile

.PHONY: help dev build clean install test

# Помощь
help:
	@echo "Квант v2.0 - Команды разработки"
	@echo ""
	@echo "Доступные команды:"
	@echo "  dev        - Запуск в режиме разработки"
	@echo "  build      - Сборка проекта"
	@echo "  install    - Установка зависимостей"
	@echo "  clean      - Очистка временных файлов"
	@echo "  test       - Запуск тестов"
	@echo ""

# Установка зависимостей
install:
	@echo "📦 Установка зависимостей..."
	cd backend && go mod download
	cd frontend && npm install

# Запуск в режиме разработки (Windows)
dev:
	@echo "🚀 Запуск в режиме разработки..."
	@echo ""
	@echo "Используйте один из скриптов:"
	@echo "  .\start-dev.bat          - CMD версия (рекомендуется)"
	@echo "  .\start-dev-simple.ps1   - PowerShell версия"
	@echo ""
	@echo "Или запустите в отдельных терминалах:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Запуск backend
dev-backend:
	@echo "🔧 Запуск Go backend..."
	cd backend && go run cmd/server/main.go

# Запуск frontend
dev-frontend:
	@echo "⚛️  Запуск React frontend..."
	cd frontend && npm run dev

# Сборка проекта
build:
	@echo "🏗️  Сборка проекта..."
	cd frontend && npm run build
	cd backend && go build -o bin/server cmd/server/main.go

# Очистка
clean:
	@echo "🧹 Очистка временных файлов..."
	rm -rf backend/bin/
	rm -rf frontend/dist/
	rm -rf frontend/node_modules/
	cd backend && go clean

# Тесты
test:
	@echo "🧪 Запуск тестов..."
	cd backend && go test ./...
	cd frontend && npm run test

# Линтинг
lint:
	@echo "🔍 Проверка кода..."
	cd backend && go vet ./...
	cd frontend && npm run lint