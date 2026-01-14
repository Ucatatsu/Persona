package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"kvant-v2/internal/config"
	"kvant-v2/internal/handlers"
	"kvant-v2/internal/repositories"
	"kvant-v2/internal/services"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Загружаем переменные окружения
	if err := godotenv.Load(); err != nil {
		slog.Warn("No .env file found")
	}

	// Инициализируем конфигурацию
	cfg := config.Load()

	// Настраиваем логирование
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	slog.Info("🚀 Starting Kvant v2.0 server", "port", cfg.Port)

	// Инициализируем репозитории
	userRepo := repositories.NewUserRepository(cfg.DatabaseURL)
	chatRepo := repositories.NewChatRepository(cfg.DatabaseURL)
	messageRepo := repositories.NewMessageRepository(cfg.DatabaseURL)

	// Инициализируем сервисы
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	userService := services.NewUserService(userRepo)
	chatService := services.NewChatService(chatRepo, messageRepo)
	wsService := services.NewWebSocketService()

	// Инициализируем хендлеры
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	chatHandler := handlers.NewChatHandler(chatService)
	wsHandler := handlers.NewWebSocketHandler(wsService)

	// Настраиваем роутер
	router := mux.NewRouter()

	// API роуты
	api := router.PathPrefix("/api").Subrouter()
	
	// Аутентификация
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/refresh", authHandler.Refresh).Methods("POST")

	// WebSocket
	api.HandleFunc("/ws", wsHandler.HandleWebSocket)

	// Чаты (требуют аутентификации)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(authHandler.AuthMiddleware)
	protected.HandleFunc("/users/me", userHandler.GetMe).Methods("GET")
	protected.HandleFunc("/chats", chatHandler.GetChats).Methods("GET")
	protected.HandleFunc("/chats", chatHandler.CreateChat).Methods("POST")
	protected.HandleFunc("/chats/{id}/messages", chatHandler.GetMessages).Methods("GET")

	// Статические файлы (React build)
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend/dist/")))

	// CORS middleware
	router.Use(corsMiddleware)

	// Создаем HTTP сервер
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Запускаем сервер в горутине
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	slog.Info("✅ Server started successfully", "address", "http://localhost:"+cfg.Port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("✅ Server exited")
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}