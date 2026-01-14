package services

import (
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type WebSocketService struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	mutex      sync.RWMutex
}

func NewWebSocketService() *WebSocketService {
	service := &WebSocketService{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
	}

	// Запускаем горутину для обработки событий
	go service.run()

	return service
}

func (s *WebSocketService) run() {
	for {
		select {
		case client := <-s.register:
			s.mutex.Lock()
			s.clients[client.ID] = client
			s.mutex.Unlock()
			slog.Info("Client registered", "clientID", client.ID, "userID", client.UserID)

		case client := <-s.unregister:
			s.mutex.Lock()
			if _, ok := s.clients[client.ID]; ok {
				delete(s.clients, client.ID)
				close(client.Send)
			}
			s.mutex.Unlock()
			slog.Info("Client unregistered", "clientID", client.ID, "userID", client.UserID)

		case message := <-s.broadcast:
			s.mutex.RLock()
			for _, client := range s.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(s.clients, client.ID)
				}
			}
			s.mutex.RUnlock()
		}
	}
}

func (s *WebSocketService) RegisterClient(userID string, conn *websocket.Conn) *Client {
	client := &Client{
		ID:     generateClientID(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	s.register <- client

	// Запускаем горутину для отправки сообщений клиенту
	go s.writePump(client)

	return client
}

func (s *WebSocketService) UnregisterClient(client *Client) {
	s.unregister <- client
}

func (s *WebSocketService) HandleMessage(client *Client, message map[string]interface{}) {
	slog.Info("Received message", "clientID", client.ID, "message", message)

	// Здесь будет логика обработки различных типов сообщений
	messageType, ok := message["type"].(string)
	if !ok {
		slog.Warn("Message without type", "clientID", client.ID)
		return
	}

	switch messageType {
	case "ping":
		s.sendToClient(client, map[string]interface{}{
			"type": "pong",
		})
	case "message":
		// Обработка текстового сообщения
		s.handleTextMessage(client, message)
	case "typing":
		// Обработка индикатора печати
		s.handleTyping(client, message)
	default:
		slog.Warn("Unknown message type", "type", messageType, "clientID", client.ID)
	}
}

func (s *WebSocketService) handleTextMessage(client *Client, message map[string]interface{}) {
	// Здесь будет сохранение сообщения в базу данных
	// и отправка другим участникам чата
	slog.Info("Handling text message", "clientID", client.ID)
}

func (s *WebSocketService) handleTyping(client *Client, message map[string]interface{}) {
	// Отправляем индикатор печати другим участникам чата
	slog.Info("Handling typing indicator", "clientID", client.ID)
}

func (s *WebSocketService) sendToClient(client *Client, message map[string]interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		slog.Error("Failed to marshal message", "error", err)
		return
	}
	
	select {
	case client.Send <- data:
	default:
		close(client.Send)
		s.mutex.Lock()
		delete(s.clients, client.ID)
		s.mutex.Unlock()
	}
}

func (s *WebSocketService) writePump(client *Client) {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				slog.Error("Write message failed", "error", err, "clientID", client.ID)
				return
			}
		}
	}
}

func generateClientID() string {
	return uuid.New().String()
}