package websocket

import (
	"database/sql"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/kvant/messenger/pkg/utils"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
	db     *sql.DB
}

func NewClient(hub *Hub, conn *websocket.Conn, userID string, db *sql.DB) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		db:     db,
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.UnregisterClient(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		c.handleMessage(message)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(data []byte) {
	var msg map[string]interface{}
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Failed to unmarshal message: %v", err)
		return
	}

	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "send_message":
		c.handleSendMessage(msg)
	case "typing", "typing_start", "typing_stop":
		c.handleTyping(msg)
	case "mark_read":
		c.handleMarkRead(msg)
	}
}

func (c *Client) handleSendMessage(msg map[string]interface{}) {
	receiverID, ok := msg["receiver_id"].(string)
	if !ok {
		return
	}

	text, ok := msg["text"].(string)
	if !ok || text == "" {
		return
	}

	messageID := uuid.New().String()
	
	// Parse message for file attachments
	var fileURL *string
	var messageType string = "text"
	
	// Check if message contains file URL in format [type]url
	if strings.HasPrefix(text, "[image]") {
		url := strings.TrimPrefix(text, "[image]")
		fileURL = &url
		messageType = "image"
		text = "" // Clear text for image-only messages
	} else if strings.HasPrefix(text, "[file]") {
		url := strings.TrimPrefix(text, "[file]")
		fileURL = &url
		messageType = "file"
	}

	// Get reply_to_id if present
	var replyToID *string
	if replyTo, ok := msg["reply_to_id"].(string); ok && replyTo != "" {
		replyToID = &replyTo
	}

	// Save to database
	var err error
	if fileURL != nil {
		if replyToID != nil {
			_, err = c.db.Exec(utils.AdaptQuery(`
				INSERT INTO messages (id, sender_id, receiver_id, text, message_type, file_url, reply_to_id)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
			`), messageID, c.userID, receiverID, text, messageType, *fileURL, *replyToID)
		} else {
			_, err = c.db.Exec(utils.AdaptQuery(`
				INSERT INTO messages (id, sender_id, receiver_id, text, message_type, file_url)
				VALUES ($1, $2, $3, $4, $5, $6)
			`), messageID, c.userID, receiverID, text, messageType, *fileURL)
		}
	} else {
		if replyToID != nil {
			_, err = c.db.Exec(utils.AdaptQuery(`
				INSERT INTO messages (id, sender_id, receiver_id, text, message_type, reply_to_id)
				VALUES ($1, $2, $3, $4, 'text', $5)
			`), messageID, c.userID, receiverID, text, *replyToID)
		} else {
			_, err = c.db.Exec(utils.AdaptQuery(`
				INSERT INTO messages (id, sender_id, receiver_id, text, message_type)
				VALUES ($1, $2, $3, $4, 'text')
			`), messageID, c.userID, receiverID, text)
		}
	}

	if err != nil {
		log.Printf("Failed to save message: %v", err)
		return
	}

	// Get sender info
	var username string
	var avatarURL *string
	c.db.QueryRow(`
		SELECT username, avatar_url FROM users WHERE id = $1
	`, c.userID).Scan(&username, &avatarURL)

	// Get replied message if exists
	var repliedMessage map[string]interface{}
	if replyToID != nil {
		var repliedText string
		var repliedSenderID string
		var repliedFileURL *string
		var repliedMessageType string
		err := c.db.QueryRow(`
			SELECT text, sender_id, file_url, message_type
			FROM messages WHERE id = $1
		`, *replyToID).Scan(&repliedText, &repliedSenderID, &repliedFileURL, &repliedMessageType)
		
		if err == nil {
			repliedMessage = map[string]interface{}{
				"id":           *replyToID,
				"text":         repliedText,
				"sender_id":    repliedSenderID,
				"message_type": repliedMessageType,
			}
			if repliedFileURL != nil {
				repliedMessage["file_url"] = *repliedFileURL
			}
		}
	}

	// Send to receiver
	response := map[string]interface{}{
		"type":         "new_message",
		"id":           messageID,
		"sender_id":    c.userID,
		"receiver_id":  receiverID,
		"text":         text,
		"message_type": messageType,
		"sender_name":  username,
		"is_read":      false,
		"read_at":      nil,
		"created_at":   time.Now(),
	}

	if avatarURL != nil {
		response["sender_avatar_url"] = *avatarURL
	}
	
	if fileURL != nil {
		response["file_url"] = *fileURL
	}

	if replyToID != nil {
		response["reply_to_id"] = *replyToID
		if repliedMessage != nil {
			response["replied_message"] = repliedMessage
		}
	}

	// Send only to receiver (sender will add it locally)
	c.hub.SendToUser(receiverID, response)
}

func (c *Client) handleTyping(msg map[string]interface{}) {
	receiverID, ok := msg["receiver_id"].(string)
	if !ok {
		return
	}

	msgType, _ := msg["type"].(string)
	
	// Determine if typing started or stopped
	typing := msgType == "typing_start" || msgType == "typing"

	response := map[string]interface{}{
		"type":    msgType, // Send back the same type (typing_start or typing_stop)
		"user_id": c.userID,
		"typing":  typing,
	}

	c.hub.SendToUser(receiverID, response)
}

func (c *Client) handleMarkRead(msg map[string]interface{}) {
	senderID, ok := msg["sender_id"].(string)
	if !ok {
		return
	}

	// Update messages as read in database
	result, err := c.db.Exec(utils.AdaptQuery(`
		UPDATE messages
		SET is_read = true, read_at = CURRENT_TIMESTAMP
		WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
	`), senderID, c.userID)

	if err != nil {
		log.Printf("Failed to mark messages as read: %v", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return
	}

	// Notify sender that messages were read
	response := map[string]interface{}{
		"type":        "messages_read",
		"reader_id":   c.userID,
		"sender_id":   senderID,
		"read_at":     time.Now(),
	}

	c.hub.SendToUser(senderID, response)
}
