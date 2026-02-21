package models

import "time"

type User struct {
	ID            string     `json:"id"`
	Username      string     `json:"username"` // Уникальный, неизменяемый
	PasswordHash  string     `json:"-"`
	DisplayName   *string    `json:"display_name,omitempty"` // Отображаемое имя
	Bio           *string    `json:"bio,omitempty"`
	AvatarURL     *string    `json:"avatar_url,omitempty"`
	BannerURL     *string    `json:"banner_url,omitempty"`
	Role          string     `json:"role"`
	IsPremium     bool       `json:"is_premium"`
	PremiumUntil  *time.Time `json:"premium_until,omitempty"`
	NameColor     *string    `json:"name_color,omitempty"`
	ProfileTheme  string     `json:"profile_theme"`
	BubbleStyle   string     `json:"bubble_style"`
	HideOnline    bool       `json:"hide_online"`
	Status        string     `json:"status"`
	IsOnline      bool       `json:"is_online"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Token   string `json:"token"`
	User    User   `json:"user"`
}
