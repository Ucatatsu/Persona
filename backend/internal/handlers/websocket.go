package handlers

import (
	"log/slog"
	"net/http"

	"kvant-v2/internal/services"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// В продакшене нужно проверять origin
		return true
	},
}

type WebSocketHandler struct {
	wsService *services.WebSocketService
}

func NewWebSocketHandler(wsService *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{
		wsService: wsService,
	}
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Получаем токен из query параметров
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Token required", http.StatusUnauthorized)
		return
	}

	// Здесь должна быть валидация токена
	// userID, err := h.authService.ValidateToken(token)
	// Пока используем заглушку
	userID := "user-123"

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}

	// Регистрируем клиента
	client := h.wsService.RegisterClient(userID, conn)
	defer h.wsService.UnregisterClient(client)

	slog.Info("WebSocket client connected", "userID", userID)

	// Обрабатываем сообщения от клиента
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket error", "error", err)
			}
			break
		}

		// Обрабатываем входящее сообщение
		h.wsService.HandleMessage(client, msg)
	}
}