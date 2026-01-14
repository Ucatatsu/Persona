package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          string    `json:"id" db:"id"`
	Username    string    `json:"username" db:"username"`
	Email       string    `json:"email" db:"email"`
	DisplayName *string   `json:"display_name" db:"display_name"`
	AvatarURL   *string   `json:"avatar_url" db:"avatar_url"`
	BannerURL   *string   `json:"banner_url" db:"banner_url"`
	Bio         *string   `json:"bio" db:"bio"`
	Status      string    `json:"status" db:"status"` // online, offline, away, busy
	Role        string    `json:"role" db:"role"`     // user, admin, moderator
	IsPremium   bool      `json:"is_premium" db:"is_premium"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	LastSeenAt  time.Time `json:"last_seen_at" db:"last_seen_at"`
}

func NewUser() *User {
	now := time.Now()
	return &User{
		ID:         uuid.New().String(),
		Status:     "offline",
		Role:       "user",
		IsPremium:  false,
		CreatedAt:  now,
		UpdatedAt:  now,
		LastSeenAt: now,
	}
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}