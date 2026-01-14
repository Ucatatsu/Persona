package handlers

import (
	"encoding/json"
	"net/http"

	"kvant-v2/internal/services"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetMe возвращает профиль текущего пользователя
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetUserByID возвращает профиль пользователя по ID
func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	// TODO: Извлечь ID из URL параметров
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// UpdateProfile обновляет профиль пользователя
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// TODO: Реализовать обновление профиля
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// SearchUsers ищет пользователей по запросу
func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	// TODO: Реализовать поиск пользователей
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
