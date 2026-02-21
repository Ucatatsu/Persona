package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/kvant/messenger/internal/middleware"
	"github.com/kvant/messenger/internal/models"
	"github.com/kvant/messenger/pkg/utils"
)

type UserHandler struct {
	db                *sql.DB
	cloudinaryEnabled bool
	cloudinary        *utils.CloudinaryUploader
}

func NewUserHandler(db *sql.DB) *UserHandler {
	handler := &UserHandler{
		db:                db,
		cloudinaryEnabled: false,
	}

	// Try to initialize Cloudinary
	cld, err := utils.NewCloudinaryUploader()
	if err == nil {
		handler.cloudinary = cld
		handler.cloudinaryEnabled = true
	}

	return handler
}

func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		utils.RespondJSON(w, http.StatusOK, []models.User{})
		return
	}

	userID := middleware.GetUserID(r)

	rows, err := h.db.Query(utils.AdaptQuery(`
		SELECT id, username, display_name, avatar_url, role, is_premium
		FROM users
		WHERE (username LIKE $1 OR display_name LIKE $1)
		AND id != $2
		LIMIT 20
	`), "%"+query+"%", userID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Search failed")
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.Username, &user.DisplayName, &user.AvatarURL,
			&user.Role, &user.IsPremium,
		)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	utils.RespondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	var user models.User
	err := h.db.QueryRow(utils.AdaptQuery(`
		SELECT id, username, display_name, bio, avatar_url, banner_url,
		       role, is_premium, premium_until, name_color, profile_theme,
		       bubble_style, hide_online, status, created_at, updated_at
		FROM users WHERE id = $1
	`), userID).Scan(
		&user.ID, &user.Username, &user.DisplayName, &user.Bio,
		&user.AvatarURL, &user.BannerURL, &user.Role,
		&user.IsPremium, &user.PremiumUntil, &user.NameColor,
		&user.ProfileTheme, &user.BubbleStyle, &user.HideOnline,
		&user.Status, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		utils.RespondError(w, http.StatusNotFound, "User not found")
		return
	}

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	utils.RespondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]
	currentUserID := middleware.GetUserID(r)

	if userID != currentUserID {
		utils.RespondError(w, http.StatusForbidden, "Cannot update other user's profile")
		return
	}

	var req struct {
		DisplayName *string `json:"display_name"`
		Bio         *string `json:"bio"`
		NameColor   *string `json:"name_color"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	_, err := h.db.Exec(`
		UPDATE users
		SET display_name = COALESCE($1, display_name),
		    bio = COALESCE($2, bio),
		    name_color = COALESCE($3, name_color),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`, req.DisplayName, req.Bio, req.NameColor, userID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	// Return updated user
	var user models.User
	err = h.db.QueryRow(`
		SELECT id, username, display_name, bio, avatar_url, banner_url,
		       role, is_premium, premium_until, name_color, profile_theme,
		       bubble_style, hide_online, status, created_at, updated_at
		FROM users WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.Username, &user.DisplayName, &user.Bio,
		&user.AvatarURL, &user.BannerURL, &user.Role,
		&user.IsPremium, &user.PremiumUntil, &user.NameColor,
		&user.ProfileTheme, &user.BubbleStyle, &user.HideOnline,
		&user.Status, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get updated user")
		return
	}

	utils.RespondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]
	currentUserID := middleware.GetUserID(r)

	if userID != currentUserID {
		utils.RespondError(w, http.StatusForbidden, "Cannot update other user's avatar")
		return
	}

	// Parse multipart form (10MB max)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	// Validate file
	if err := utils.ValidateImageFile(file, header); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var avatarURL string

	// Upload to Cloudinary if enabled
	if h.cloudinaryEnabled {
		url, err := h.cloudinary.UploadAvatar(r.Context(), file, header.Filename, userID)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to upload image")
			return
		}
		avatarURL = url
	} else {
		// Fallback to placeholder
		avatarURL = "/uploads/avatars/" + userID + ".jpg"
	}

	// Update database
	_, err = h.db.Exec(`
		UPDATE users
		SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, avatarURL, userID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update avatar")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{"avatar_url": avatarURL})
}

func (h *UserHandler) UploadBanner(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]
	currentUserID := middleware.GetUserID(r)

	if userID != currentUserID {
		utils.RespondError(w, http.StatusForbidden, "Cannot update other user's banner")
		return
	}

	// Parse multipart form (10MB max)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("banner")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	// Validate file
	if err := utils.ValidateImageFile(file, header); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var bannerURL string

	// Upload to Cloudinary if enabled
	if h.cloudinaryEnabled {
		url, err := h.cloudinary.UploadBanner(r.Context(), file, header.Filename, userID)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to upload image")
			return
		}
		bannerURL = url
	} else {
		// Fallback to placeholder
		bannerURL = "/uploads/banners/" + userID + ".jpg"
	}

	// Update database
	_, err = h.db.Exec(`
		UPDATE users
		SET banner_url = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, bannerURL, userID)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update banner")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{"banner_url": bannerURL})
}
