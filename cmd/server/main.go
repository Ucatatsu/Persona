package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/kvant/messenger/internal/database"
	"github.com/kvant/messenger/internal/handlers"
	"github.com/kvant/messenger/internal/middleware"
	"github.com/kvant/messenger/internal/websocket"
	"github.com/rs/cors"
)

const (
	Version     = "2H1C1S"
	ReleaseDate = "2026-01-24"
	VersionEra  = "Horse" // Chinese Zodiac Year
)

func main() {
	// Print version info
	log.Printf("🚀 Starting Persona Messenger %s (Released: %s, Year of the %s)", Version, ReleaseDate, VersionEra)
	
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	db, err := database.Connect()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	userHandler := handlers.NewUserHandler(db)
	messageHandler := handlers.NewMessageHandler(db, hub)
	wsHandler := handlers.NewWebSocketHandler(hub, db)

	// CORS configuration
	corsOrigin := os.Getenv("CORS_ORIGIN")
	allowedOrigins := []string{
		"http://localhost:5173", 
		"http://localhost:5174", 
		"http://localhost:5175",
		"http://192.168.0.47:5173",
		"capacitor://localhost",
		"ionic://localhost",
		"http://localhost",
	}
	
	if corsOrigin != "" {
		allowedOrigins = append(allowedOrigins, corsOrigin)
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	// Create main mux
	mainMux := http.NewServeMux()

	// WebSocket handler (NO middleware at all)
	mainMux.HandleFunc("/api/ws", wsHandler.HandleWebSocket)

	// HTTP API router with CORS and logging
	apiRouter := mux.NewRouter()
	
	// Public routes
	apiRouter.HandleFunc("/api/health", handlers.HealthCheck).Methods("GET")
	apiRouter.HandleFunc("/api/version", handlers.GetVersion).Methods("GET")
	apiRouter.HandleFunc("/api/register", authHandler.Register).Methods("POST")
	apiRouter.HandleFunc("/api/login", authHandler.Login).Methods("POST")

	// Protected routes
	api := apiRouter.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware)

	// User routes
	api.HandleFunc("/users/search", userHandler.SearchUsers).Methods("GET")
	api.HandleFunc("/users/{id}", userHandler.GetUser).Methods("GET")
	api.HandleFunc("/users/{id}", userHandler.UpdateUser).Methods("PUT")
	api.HandleFunc("/users/{id}/avatar", userHandler.UploadAvatar).Methods("POST")
	api.HandleFunc("/users/{id}/banner", userHandler.UploadBanner).Methods("POST")

	// Message routes
	api.HandleFunc("/messages/recent", messageHandler.GetRecentChats).Methods("GET")
	api.HandleFunc("/messages/upload", messageHandler.UploadFile).Methods("POST")
	api.HandleFunc("/messages/{messageId}/edit", messageHandler.EditMessage).Methods("PUT")
	api.HandleFunc("/messages/{messageId}/delete", messageHandler.DeleteMessage).Methods("DELETE")
	api.HandleFunc("/messages/{messageId}/reactions", messageHandler.AddReaction).Methods("POST")
	api.HandleFunc("/messages/{messageId}/reactions", messageHandler.RemoveReaction).Methods("DELETE")
	api.HandleFunc("/messages/{messageId}/pin", messageHandler.PinMessage).Methods("POST")
	api.HandleFunc("/messages/{messageId}/unpin", messageHandler.UnpinMessage).Methods("POST")
	api.HandleFunc("/messages/{userId}/read", messageHandler.MarkAsRead).Methods("POST")
	api.HandleFunc("/messages/{userId}", messageHandler.GetMessages).Methods("GET")

	// Wrap API router with CORS and logging
	apiHandler := middleware.LoggingMiddleware(c.Handler(apiRouter))
	mainMux.Handle("/api/", apiHandler)

	// Start server (NO logging middleware on mainMux)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on 0.0.0.0:%s", port)
	log.Printf("🌐 CORS enabled for: %v", allowedOrigins)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, mainMux))
}
