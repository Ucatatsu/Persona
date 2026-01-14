package models

import (
	"time"

	"github.com/google/uuid"
)

type MessageType string

const (
	MessageTypeText     MessageType = "text"
	MessageTypeImage    MessageType = "image"
	MessageTypeFile     MessageType = "file"
	MessageTypeAudio    MessageType = "audio"
	MessageTypeSticker  MessageType = "sticker"
	MessageTypeSystem   MessageType = "system"
)

type Message struct {
	ID        string      `json:"id" db:"id"`
	ChatID    string      `json:"chat_id" db:"chat_id"`
	UserID    string      `json:"user_id" db:"user_id"`
	Type      MessageType `json:"type" db:"type"`
	Content   string      `json:"content" db:"content"`
	FileURL   *string     `json:"file_url" db:"file_url"`
	FileName  *string     `json:"file_name" db:"file_name"`
	FileSize  *int64      `json:"file_size" db:"file_size"`
	ReplyToID *string     `json:"reply_to_id" db:"reply_to_id"`
	IsEdited  bool        `json:"is_edited" db:"is_edited"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt time.Time   `json:"updated_at" db:"updated_at"`
	
	// Дополнительные поля для UI
	User    *User    `json:"user,omitempty"`
	ReplyTo *Message `json:"reply_to,omitempty"`
	
	// Статусы доставки
	DeliveredAt *time.Time `json:"delivered_at" db:"delivered_at"`
	ReadAt      *time.Time `json:"read_at" db:"read_at"`
}

func NewMessage(chatID, userID string, messageType MessageType, content string) *Message {
	now := time.Now()
	return &Message{
		ID:        uuid.New().String(),
		ChatID:    chatID,
		UserID:    userID,
		Type:      messageType,
		Content:   content,
		IsEdited:  false,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

type SendMessageRequest struct {
	ChatID    string      `json:"chat_id" validate:"required"`
	Type      MessageType `json:"type" validate:"required"`
	Content   string      `json:"content"`
	ReplyToID *string     `json:"reply_to_id"`
}

type EditMessageRequest struct {
	Content string `json:"content" validate:"required"`
}