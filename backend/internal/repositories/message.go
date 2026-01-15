package repositories

import (
	"errors"
	"sort"
	"sync"

	"kvant-v2/internal/models"
)

type MessageRepository struct {
	databaseURL  string
	messages     map[string]*models.Message // MessageID -> Message
	chatMessages map[string][]string        // ChatID -> []MessageID
	mu           sync.RWMutex
}

func NewMessageRepository(databaseURL string) *MessageRepository {
	return &MessageRepository{
		databaseURL:  databaseURL,
		messages:     make(map[string]*models.Message),
		chatMessages: make(map[string][]string),
	}
}

func (r *MessageRepository) Create(message *models.Message) (*models.Message, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.messages[message.ID] = message
	r.chatMessages[message.ChatID] = append(r.chatMessages[message.ChatID], message.ID)

	return message, nil
}

func (r *MessageRepository) GetByID(id string) (*models.Message, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	message, exists := r.messages[id]
	if !exists {
		return nil, errors.New("message not found")
	}

	return message, nil
}

func (r *MessageRepository) GetChatMessages(chatID string, limit, offset int) ([]*models.Message, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	messageIDs, exists := r.chatMessages[chatID]
	if !exists {
		return []*models.Message{}, nil
	}

	// Получаем все сообщения
	messages := make([]*models.Message, 0, len(messageIDs))
	for _, msgID := range messageIDs {
		if msg, exists := r.messages[msgID]; exists {
			messages = append(messages, msg)
		}
	}

	// Сортируем по времени создания (новые первыми)
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].CreatedAt.After(messages[j].CreatedAt)
	})

	// Применяем offset и limit
	start := offset
	if start > len(messages) {
		return []*models.Message{}, nil
	}

	end := start + limit
	if end > len(messages) {
		end = len(messages)
	}

	return messages[start:end], nil
}

func (r *MessageRepository) Update(message *models.Message) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.messages[message.ID]; !exists {
		return errors.New("message not found")
	}

	r.messages[message.ID] = message
	return nil
}

func (r *MessageRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	message, exists := r.messages[id]
	if !exists {
		return errors.New("message not found")
	}

	// Удаляем из списка сообщений чата
	chatID := message.ChatID
	messageIDs := r.chatMessages[chatID]
	for i, msgID := range messageIDs {
		if msgID == id {
			r.chatMessages[chatID] = append(messageIDs[:i], messageIDs[i+1:]...)
			break
		}
	}

	// Удаляем само сообщение
	delete(r.messages, id)

	return nil
}