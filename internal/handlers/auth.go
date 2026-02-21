package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/kvant/messenger/internal/models"
	"github.com/kvant/messenger/pkg/utils"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if len(req.Username) < 3 || len(req.Username) > 20 {
		utils.RespondError(w, http.StatusBadRequest, "Username must be 3-20 characters")
		return
	}

	if len(req.Password) < 6 {
		utils.RespondError(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	userID := utils.GenerateUUID()
	var user models.User

	err = h.db.QueryRow(`
		INSERT INTO users (id, username, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, role, is_premium, profile_theme, bubble_style, hide_online, status, created_at, updated_at
	`, userID, req.Username, string(hashedPassword)).Scan(
		&user.ID, &user.Username, &user.Role, &user.IsPremium,
		&user.ProfileTheme, &user.BubbleStyle, &user.HideOnline, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		utils.RespondError(w, http.StatusConflict, "Username already exists")
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	var user models.User
	var passwordHash string

	err := h.db.QueryRow(utils.AdaptQuery(`
		SELECT id, username, password_hash, display_name, bio, avatar_url, banner_url,
		       role, is_premium, premium_until, name_color, profile_theme,
		       bubble_style, hide_online, status, created_at, updated_at
		FROM users WHERE username = $1
	`), req.Username).Scan(
		&user.ID, &user.Username, &passwordHash, &user.DisplayName, &user.Bio,
		&user.AvatarURL, &user.BannerURL, &user.Role, &user.IsPremium,
		&user.PremiumUntil, &user.NameColor, &user.ProfileTheme, &user.BubbleStyle,
		&user.HideOnline, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.LoginResponse{
		Success: true,
		Token:   token,
		User:    user,
	})
}
