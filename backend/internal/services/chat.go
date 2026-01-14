package services

import (
	"kvant-v2/internal/models"
	"kvant-v2/internal/repositories"
)

type ChatService struct {
	chatRepo    *repositories.ChatRepository
	messageRepo *repositories.MessageRepository
}

func NewChatService(chatRepo *repositories.ChatRepository, messageRepo *repositories.MessageRepository) *ChatService {
	return &ChatService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
	}
}

func (s *ChatService) GetUserChats(userID string) ([]*models.Chat, error) {
	return s.chatRepo.GetUserChats(userID)
}

func (s *ChatService) CreateChat(ownerID string, req models.CreateChatRequest) (*models.Chat, error) {
	chat := &models.Chat{
		Type:        req.Type,
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     ownerID,
		IsPrivate:   req.IsPrivate,
	}

	createdChat, err := s.chatRepo.Create(chat)
	if err != nil {
		return nil, err
	}

	// Добавляем владельца как участника
	err = s.chatRepo.AddParticipant(createdChat.ID, ownerID, "owner")
	if err != nil {
		return nil, err
	}

	// Добавляем других участников
	for _, participantID := range req.ParticipantIDs {
		err = s.chatRepo.AddParticipant(createdChat.ID, participantID, "member")
		if err != nil {
			return nil, err
		}
	}

	return createdChat, nil
}

func (s *ChatService) HasChatAccess(userID, chatID string) (bool, error) {
	return s.chatRepo.HasAccess(userID, chatID)
}

func (s *ChatService) GetChatMessages(chatID string, limit, offset int) ([]*models.Message, error) {
	return s.messageRepo.GetChatMessages(chatID, limit, offset)
}