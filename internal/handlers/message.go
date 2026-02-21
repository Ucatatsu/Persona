package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/kvant/messenger/internal/middleware"
	"github.com/kvant/messenger/internal/models"
	"github.com/kvant/messenger/internal/websocket"
	"github.com/kvant/messenger/pkg/utils"
)

type MessageHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewMessageHandler(db *sql.DB, hub *websocket.Hub) *MessageHandler {
	return &MessageHandler{db: db, hub: hub}
}

func (h *MessageHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	otherUserID := vars["userId"]
	currentUserID := middleware.GetUserID(r)

	rows, err := h.db.Query(utils.AdaptQuery(`
		SELECT m.id, m.sender_id, m.receiver_id, m.text, m.message_type,
		       m.file_url, m.is_read, m.reply_to_id, m.read_at, m.edited_at, m.created_at, m.pinned_at,
		       u.username, u.avatar_url
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE ((m.sender_id = $1 AND m.receiver_id = $2)
		   OR (m.sender_id = $2 AND m.receiver_id = $1))
		   AND m.deleted_at IS NULL
		   AND (
		     (m.sender_id = $1 AND m.deleted_for_sender = 0)
		     OR (m.receiver_id = $1 AND m.deleted_for_receiver = 0)
		   )
		ORDER BY m.created_at ASC
		LIMIT 100
	`), currentUserID, otherUserID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get messages")
		return
	}
	defer rows.Close()

	var messages []models.Message
	messageMap := make(map[string]*models.Message)
	var messageIDs []interface{} // for reaction query placeholders
	
	for rows.Next() {
		var msg models.Message
		err := rows.Scan(
			&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Text,
			&msg.MessageType, &msg.FileURL, &msg.IsRead, &msg.ReplyToID,
			&msg.ReadAt, &msg.EditedAt, &msg.CreatedAt, &msg.PinnedAt, &msg.SenderName, &msg.SenderAvatarURL,
		)
		if err != nil {
			continue
		}
		msg.Reactions = []models.Reaction{} // Initialize empty slice
		messages = append(messages, msg)
		messageMap[msg.ID] = &messages[len(messages)-1]
		messageIDs = append(messageIDs, msg.ID)
	}

	// Populate replied messages
	for i := range messages {
		if messages[i].ReplyToID != nil {
			if repliedMsg, ok := messageMap[*messages[i].ReplyToID]; ok {
				// Create a copy to avoid circular references
				replied := &models.Message{
					ID:          repliedMsg.ID,
					SenderID:    repliedMsg.SenderID,
					Text:        repliedMsg.Text,
					MessageType: repliedMsg.MessageType,
					FileURL:     repliedMsg.FileURL,
					CreatedAt:   repliedMsg.CreatedAt,
				}
				messages[i].RepliedMessage = replied
			}
		}
	}

	// Fetch reactions if any messages found
	if len(messages) > 0 {
		placeholders := make([]string, len(messageIDs))
		for i := range placeholders {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
		}
		
		query := fmt.Sprintf(`
			SELECT id, message_id, user_id, emoji, created_at
			FROM reactions
			WHERE message_id IN (%s)
		`, strings.Join(placeholders, ","))

		// Use AdaptQuery but carefully as IN clause is dynamic
		// Actually AdaptQuery handles $1, $2... so we should construct the string with $1, $2... then adapt
		
		// Re-generating placeholders to match $1, $2...
		// But AdaptQuery replaces $N with ?N.
		// So if we generate $1, $2... AdaptQuery will handle it.
		
		reactionRows, err := h.db.Query(utils.AdaptQuery(query), messageIDs...)
		if err == nil {
			defer reactionRows.Close()
			for reactionRows.Next() {
				var r models.Reaction
				if err := reactionRows.Scan(&r.ID, &r.MessageID, &r.UserID, &r.Emoji, &r.CreatedAt); err == nil {
					if msg, ok := messageMap[r.MessageID]; ok {
						msg.Reactions = append(msg.Reactions, r)
					}
				}
			}
		}
	}

	utils.RespondJSON(w, http.StatusOK, messages)
}

func (h *MessageHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	otherUserID := vars["userId"]
	currentUserID := middleware.GetUserID(r)

	_, err := h.db.Exec(`
		UPDATE messages
		SET is_read = true
		WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
	`, otherUserID, currentUserID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to mark as read")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *MessageHandler) GetRecentChats(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)

	// Get list of users with recent messages
	rows, err := h.db.Query(utils.AdaptQuery(`
		SELECT DISTINCT
			CASE 
				WHEN m.sender_id = $1 THEN m.receiver_id
				ELSE m.sender_id
			END as user_id,
			u.username,
			u.display_name,
			u.avatar_url,
			MAX(m.created_at) as last_message_time
		FROM messages m
		JOIN users u ON (
			CASE 
				WHEN m.sender_id = $1 THEN m.receiver_id
				ELSE m.sender_id
			END = u.id
		)
		WHERE m.sender_id = $1 OR m.receiver_id = $1
		GROUP BY user_id, u.username, u.display_name, u.avatar_url
		ORDER BY last_message_time DESC
		LIMIT 50
	`), currentUserID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get recent chats")
		return
	}
	defer rows.Close()

	type RecentChat struct {
		ID              string  `json:"id"`
		Username        string  `json:"username"`
		DisplayName     *string `json:"display_name,omitempty"`
		AvatarURL       *string `json:"avatar_url,omitempty"`
		LastMessageTime string  `json:"last_message_time"`
	}

	var chats []RecentChat
	for rows.Next() {
		var chat RecentChat
		err := rows.Scan(
			&chat.ID, &chat.Username, &chat.DisplayName,
			&chat.AvatarURL, &chat.LastMessageTime,
		)
		if err != nil {
			continue
		}
		chats = append(chats, chat)
	}

	utils.RespondJSON(w, http.StatusOK, chats)
}

func (h *MessageHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	currentUserID := middleware.GetUserID(r)

	// Parse multipart form (10MB max)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "File too large")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate file
	if err := utils.ValidateImageFile(file, header); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Upload to Cloudinary
	uploader, err := utils.NewCloudinaryUploader()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Upload service unavailable")
		return
	}

	// Upload to messages folder
	fileURL, err := h.uploadMessageFile(r.Context(), uploader, file, header.Filename, currentUserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload file")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"url": fileURL,
	})
}

func (h *MessageHandler) uploadMessageFile(ctx context.Context, uploader *utils.CloudinaryUploader, file multipart.File, filename, userID string) (string, error) {
	// Use the existing Cloudinary uploader structure
	// For now, we'll use a simple approach - upload as image to messages folder
	ext := strings.ToLower(filepath.Ext(filename))
	uniqueName := fmt.Sprintf("%d_%s%s", time.Now().Unix(), userID[:8], ext)
	
	// For simplicity, reuse the uploadImage method with a custom folder
	// In production, you might want to add a dedicated method for message files
	return uploader.UploadAvatar(ctx, file, uniqueName, userID)
}

func (h *MessageHandler) EditMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)

	var req struct {
		Text string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if req.Text == "" {
		utils.RespondError(w, http.StatusBadRequest, "Message text cannot be empty")
		return
	}

	// Check if message exists and belongs to current user
	var senderID, receiverID string
	err := h.db.QueryRow(`
		SELECT sender_id, receiver_id FROM messages WHERE id = $1
	`, messageID).Scan(&senderID, &receiverID)

	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	// Only sender can edit their message
	if senderID != currentUserID {
		utils.RespondError(w, http.StatusForbidden, "You can only edit your own messages")
		return
	}

	// Update message
	now := time.Now()
	_, err = h.db.Exec(`
		UPDATE messages
		SET text = $1, edited_at = $2
		WHERE id = $3
	`, req.Text, now, messageID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to edit message")
		return
	}

	// Get updated message
	var msg models.Message
	err = h.db.QueryRow(`
		SELECT m.id, m.sender_id, m.receiver_id, m.text, m.message_type,
		       m.file_url, m.is_read, m.reply_to_id, m.read_at, m.edited_at, m.created_at,
		       u.username, u.avatar_url
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.id = $1
	`, messageID).Scan(
		&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Text,
		&msg.MessageType, &msg.FileURL, &msg.IsRead, &msg.ReplyToID,
		&msg.ReadAt, &msg.EditedAt, &msg.CreatedAt, &msg.SenderName, &msg.SenderAvatarURL,
	)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get updated message")
		return
	}

	// Broadcast edit to both users via WebSocket
	editMessage := map[string]interface{}{
		"type": "message_edited",
		"data": msg,
	}
	h.hub.SendToUser(senderID, editMessage)
	h.hub.SendToUser(receiverID, editMessage)

	utils.RespondJSON(w, http.StatusOK, msg)
}

func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)

	var req struct {
		DeleteForEveryone bool `json:"delete_for_everyone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	// Get message details
	var senderID, receiverID string
	var createdAt time.Time
	err := h.db.QueryRow(`
		SELECT sender_id, receiver_id, created_at FROM messages WHERE id = ?
	`, messageID).Scan(&senderID, &receiverID, &createdAt)

	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	// Determine if user is sender or receiver
	isSender := senderID == currentUserID
	isReceiver := receiverID == currentUserID

	if !isSender && !isReceiver {
		utils.RespondError(w, http.StatusForbidden, "You don't have access to this message")
		return
	}

	// Check if trying to delete for everyone
	if req.DeleteForEveryone {
		// Only sender can delete for everyone
		if !isSender {
			utils.RespondError(w, http.StatusForbidden, "Only sender can delete message for everyone")
			return
		}

		// Delete for everyone (soft delete)
		now := time.Now()
		_, err = h.db.Exec(`
			UPDATE messages
			SET deleted_at = ?, text = '[deleted]'
			WHERE id = ?
		`, now, messageID)

		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to delete message")
			return
		}

		// Broadcast deletion to both users
		deleteMessage := map[string]interface{}{
			"type": "message_deleted",
			"data": map[string]interface{}{
				"id":                messageID,
				"deleted_for_everyone": true,
			},
		}
		h.hub.SendToUser(senderID, deleteMessage)
		h.hub.SendToUser(receiverID, deleteMessage)

		utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"success": true,
			"deleted_for_everyone": true,
		})
		return
	}

	// Delete only for current user
	if isSender {
		_, err = h.db.Exec(`
			UPDATE messages SET deleted_for_sender = 1 WHERE id = ?
		`, messageID)
	} else {
		_, err = h.db.Exec(`
			UPDATE messages SET deleted_for_receiver = 1 WHERE id = ?
		`, messageID)
	}

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete message")
		return
	}

	// Notify only current user
	deleteMessage := map[string]interface{}{
		"type": "message_deleted",
		"data": map[string]interface{}{
			"id":                messageID,
			"deleted_for_everyone": false,
			"deleted_for":       currentUserID,
		},
	}
	h.hub.SendToUser(currentUserID, deleteMessage)

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"deleted_for_everyone": false,
	})
}

func (h *MessageHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)

	var req struct {
		Emoji string `json:"emoji"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if req.Emoji == "" {
		utils.RespondError(w, http.StatusBadRequest, "Emoji cannot be empty")
		return
	}

	// Check if message exists
	var senderID, receiverID string
	err := h.db.QueryRow("SELECT sender_id, receiver_id FROM messages WHERE id = ?", messageID).Scan(&senderID, &receiverID)
	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	// Check access (user must be sender or receiver)
	if currentUserID != senderID && currentUserID != receiverID {
		utils.RespondError(w, http.StatusForbidden, "You don't have access to this message")
		return
	}

	// Add reaction
	_, err = h.db.Exec(utils.AdaptQuery(`
		INSERT INTO reactions (message_id, user_id, emoji)
		VALUES ($1, $2, $3)
		ON CONFLICT (message_id, user_id, emoji) DO NOTHING
	`), messageID, currentUserID, req.Emoji)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to add reaction")
		return
	}

	// Broadcast reaction
	reactionEvent := map[string]interface{}{
		"type": "reaction_added",
		"data": map[string]interface{}{
			"message_id": messageID,
			"user_id":    currentUserID,
			"emoji":      req.Emoji,
		},
	}
	h.hub.SendToUser(senderID, reactionEvent)
	h.hub.SendToUser(receiverID, reactionEvent)

	utils.RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *MessageHandler) RemoveReaction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)
	emoji := r.URL.Query().Get("emoji")

	if emoji == "" {
		utils.RespondError(w, http.StatusBadRequest, "Emoji is required")
		return
	}

	// Check if message exists to get participants for broadcasting
	var senderID, receiverID string
	err := h.db.QueryRow("SELECT sender_id, receiver_id FROM messages WHERE id = ?", messageID).Scan(&senderID, &receiverID)
	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	// Remove reaction
	_, err = h.db.Exec(utils.AdaptQuery(`
		DELETE FROM reactions
		WHERE message_id = $1 AND user_id = $2 AND emoji = $3
	`), messageID, currentUserID, emoji)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to remove reaction")
		return
	}

	// Broadcast removal
	reactionEvent := map[string]interface{}{
		"type": "reaction_removed",
		"data": map[string]interface{}{
			"message_id": messageID,
			"user_id":    currentUserID,
			"emoji":      emoji,
		},
	}
	h.hub.SendToUser(senderID, reactionEvent)
	h.hub.SendToUser(receiverID, reactionEvent)

	utils.RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *MessageHandler) PinMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)

	// Check if message exists and user has access
	var senderID, receiverID string
	err := h.db.QueryRow("SELECT sender_id, receiver_id FROM messages WHERE id = ?", messageID).Scan(&senderID, &receiverID)
	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	if currentUserID != senderID && currentUserID != receiverID {
		utils.RespondError(w, http.StatusForbidden, "You don't have access to this message")
		return
	}

	// Unpin any existing pinned message in this chat
	_, err = h.db.Exec(utils.AdaptQuery(`
		UPDATE messages
		SET pinned_at = NULL
		WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
		  AND pinned_at IS NOT NULL
	`), senderID, receiverID)
	
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to unpin previous messages")
		return
	}

	// Pin the new message
	now := time.Now()
	_, err = h.db.Exec(utils.AdaptQuery(`
		UPDATE messages
		SET pinned_at = $1
		WHERE id = $2
	`), now, messageID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to pin message")
		return
	}

	// Broadcast pin event
	pinEvent := map[string]interface{}{
		"type": "message_pinned",
		"data": map[string]interface{}{
			"message_id": messageID,
			"pinned_at":  now,
			"pinner_id":  currentUserID,
		},
	}
	h.hub.SendToUser(senderID, pinEvent)
	h.hub.SendToUser(receiverID, pinEvent)

	utils.RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *MessageHandler) UnpinMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID := vars["messageId"]
	currentUserID := middleware.GetUserID(r)

	// Check if message exists
	var senderID, receiverID string
	err := h.db.QueryRow("SELECT sender_id, receiver_id FROM messages WHERE id = ?", messageID).Scan(&senderID, &receiverID)
	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "Message not found")
		return
	}
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get message")
		return
	}

	if currentUserID != senderID && currentUserID != receiverID {
		utils.RespondError(w, http.StatusForbidden, "You don't have access to this message")
		return
	}

	// Unpin message
	_, err = h.db.Exec(utils.AdaptQuery(`
		UPDATE messages
		SET pinned_at = NULL
		WHERE id = $1
	`), messageID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to unpin message")
		return
	}

	// Broadcast unpin event
	unpinEvent := map[string]interface{}{
		"type": "message_unpinned",
		"data": map[string]interface{}{
			"message_id": messageID,
		},
	}
	h.hub.SendToUser(senderID, unpinEvent)
	h.hub.SendToUser(receiverID, unpinEvent)

	utils.RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}
