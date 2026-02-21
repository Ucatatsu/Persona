.PHONY: help dev build clean docker-up docker-down

help: ## Показать помощь
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Запустить в режиме разработки
	@echo "🚀 Запуск backend..."
	@go run cmd/server/main.go &
	@echo "⚛️  Запуск frontend..."
	@cd client && npm run dev

build: ## Собрать проект
	@echo "🔨 Сборка backend..."
	@go build -o bin/kvant-server cmd/server/main.go
	@echo "🔨 Сборка frontend..."
	@cd client && npm run build
	@echo "✅ Сборка завершена!"

clean: ## Очистить сборку
	@rm -rf bin/
	@rm -rf client/dist/
	@echo "🧹 Очищено!"

docker-up: ## Запустить через Docker
	@docker-compose up -d
	@echo "🐳 Docker контейнеры запущены!"

docker-down: ## Остановить Docker
	@docker-compose down
	@echo "🐳 Docker контейнеры остановлены!"

docker-build: ## Пересобрать Docker образы
	@docker-compose up -d --build
	@echo "🐳 Docker образы пересобраны!"

install: ## Установить зависимости
	@echo "📦 Установка Go зависимостей..."
	@go mod download
	@echo "📦 Установка Node зависимостей..."
	@cd client && npm install
	@echo "✅ Зависимости установлены!"

migrate: ## Запустить миграции
	@echo "🗄️  Запуск миграций..."
	@go run cmd/server/main.go migrate
	@echo "✅ Миграции выполнены!"

test: ## Запустить тесты
	@echo "🧪 Запуск тестов..."
	@go test ./...
	@cd client && npm test

lint: ## Проверить код
	@echo "🔍 Проверка Go кода..."
	@golangci-lint run
	@echo "🔍 Проверка TypeScript кода..."
	@cd client && npm run lint
