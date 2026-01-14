package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatType string

const (
	ChatTypeDirect ChatType = "direct"
	ChatTypeGroup  ChatType = "group"
	ChatTypeServer ChatType = "server"
)

type Chat struct {
	ID          string    `json:"id" db:"id"`
	Type        ChatType  `json:"type" db:"type"`
	Name        *string   `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	AvatarURL   *string   `json:"avatar_url" db:"avatar_url"`
	OwnerID     string    `json:"owner_id" db:"owner_id"`
	IsPrivate   bool      `json:"is_private" db:"is_private"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	
	// Дополнительные поля для UI
	LastMessage    *Message `json:"last_message,omitempty"`
	UnreadCount    int      `json:"unread_count"`
	ParticipantIDs []string `json:"participant_ids,omitempty"`
}

func NewChat(chatType ChatType, ownerID string) *Chat {
	now := time.Now()
	return &Chat{
		ID:        uuid.New().String(),
		Type:      chatType,
		OwnerID:   ownerID,
		IsPrivate: false,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

type ChatParticipant struct {
	ChatID    string    `json:"chat_id" db:"chat_id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Role      string    `json:"role" db:"role"` // owner, admin, moderator, member
	JoinedAt  time.Time `json:"joined_at" db:"joined_at"`
	LastRead  time.Time `json:"last_read" db:"last_read"`
}

type CreateChatRequest struct {
	Type           ChatType `json:"type" validate:"required"`
	Name           *string  `json:"name"`
	Description    *string  `json:"description"`
	ParticipantIDs []string `json:"participant_ids"`
	IsPrivate      bool     `json:"is_private"`
}