package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/kvant/messenger/internal/middleware"
	ws "github.com/kvant/messenger/internal/websocket"
	"github.com/kvant/messenger/pkg/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: Add proper origin check
	},
}

type WebSocketHandler struct {
	hub *ws.Hub
	db  *sql.DB
}

func NewWebSocketHandler(hub *ws.Hub, db *sql.DB) *WebSocketHandler {
	return &WebSocketHandler{hub: hub, db: db}
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Try to get user ID from context (if middleware was used)
	userID := middleware.GetUserID(r)
	
	// If not in context, try to get token from query parameter
	if userID == "" {
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		// Validate token
		claims, err := utils.ValidateJWT(token)
		if err != nil {
			log.Printf("Invalid WebSocket token: %v", err)
			http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
			return
		}
		userID = claims.UserID
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := ws.NewClient(h.hub, conn, userID, h.db)
	h.hub.RegisterClient(client)

	go client.WritePump()
	go client.ReadPump()
}
