package models

import "time"

type Message struct {
	ID              string     `json:"id"`
	SenderID        string     `json:"sender_id"`
	ReceiverID      string     `json:"receiver_id"`
	Text            string     `json:"text"`
	MessageType     string     `json:"message_type"`
	FileURL         *string    `json:"file_url,omitempty"`
	IsRead          bool       `json:"is_read"`
	ReadAt          *time.Time `json:"read_at,omitempty"`
	ReplyToID       *string    `json:"reply_to_id,omitempty"`
	RepliedMessage  *Message   `json:"replied_message,omitempty"`
	SelfDestructAt  *time.Time `json:"self_destruct_at,omitempty"`
	EditedAt        *time.Time `json:"edited_at,omitempty"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty"`
	DeletedForSender bool      `json:"deleted_for_sender"`
	DeletedForReceiver bool    `json:"deleted_for_receiver"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
	SenderName      string     `json:"sender_name,omitempty"`
	SenderAvatarURL *string    `json:"sender_avatar_url,omitempty"`
	PinnedAt        *time.Time `json:"pinned_at,omitempty"`
	Reactions       []Reaction `json:"reactions,omitempty"`
}

type Reaction struct {
	ID        string    `json:"id"`
	MessageID string    `json:"message_id"`
	UserID    string    `json:"user_id"`
	Emoji     string    `json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

type SendMessageRequest struct {
	ReceiverID     string  `json:"receiver_id"`
	Text           string  `json:"text"`
	MessageType    string  `json:"message_type"`
	ReplyToID      *string `json:"reply_to_id,omitempty"`
	SelfDestructIn *int    `json:"self_destruct_in,omitempty"`
}
