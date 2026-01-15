package repositories

import (
	"errors"
	"sync"

	"kvant-v2/internal/models"
)

type ChatRepository struct {
	databaseURL  string
	chats        map[string]*models.Chat   // ChatID -> Chat
	userChats    map[string][]string       // UserID -> []ChatID
	participants map[string]map[string]string // ChatID -> UserID -> Role
	mu           sync.RWMutex
}

func NewChatRepository(databaseURL string) *ChatRepository {
	return &ChatRepository{
		databaseURL:  databaseURL,
		chats:        make(map[string]*models.Chat),
		userChats:    make(map[string][]string),
		participants: make(map[string]map[string]string),
	}
}

func (r *ChatRepository) Create(chat *models.Chat) (*models.Chat, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.chats[chat.ID] = chat
	r.participants[chat.ID] = make(map[string]string)

	return chat, nil
}

func (r *ChatRepository) GetByID(id string) (*models.Chat, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	chat, exists := r.chats[id]
	if !exists {
		return nil, errors.New("chat not found")
	}

	return chat, nil
}

func (r *ChatRepository) GetUserChats(userID string) ([]*models.Chat, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	chatIDs, exists := r.userChats[userID]
	if !exists {
		return []*models.Chat{}, nil
	}

	chats := make([]*models.Chat, 0, len(chatIDs))
	for _, chatID := range chatIDs {
		if chat, exists := r.chats[chatID]; exists {
			chats = append(chats, chat)
		}
	}

	return chats, nil
}

func (r *ChatRepository) AddParticipant(chatID, userID, role string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.chats[chatID]; !exists {
		return errors.New("chat not found")
	}

	// Добавляем участника в чат
	if r.participants[chatID] == nil {
		r.participants[chatID] = make(map[string]string)
	}
	r.participants[chatID][userID] = role

	// Добавляем чат в список чатов пользователя
	r.userChats[userID] = append(r.userChats[userID], chatID)

	return nil
}

func (r *ChatRepository) HasAccess(userID, chatID string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	participants, exists := r.participants[chatID]
	if !exists {
		return false, nil
	}

	_, hasAccess := participants[userID]
	return hasAccess, nil
}