package repositories

import (
	"errors"
	"sync"
	"time"

	"kvant-v2/internal/models"
)

type UserRepository struct {
	databaseURL string
	users       map[string]*models.User // ID -> User
	passwords   map[string]string       // ID -> HashedPassword
	usersByName map[string]string       // Username -> ID
	usersByEmail map[string]string      // Email -> ID
	mu          sync.RWMutex
}

func NewUserRepository(databaseURL string) *UserRepository {
	return &UserRepository{
		databaseURL:  databaseURL,
		users:        make(map[string]*models.User),
		passwords:    make(map[string]string),
		usersByName:  make(map[string]string),
		usersByEmail: make(map[string]string),
	}
}

func (r *UserRepository) Create(user *models.User, hashedPassword string) (*models.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Проверяем уникальность username и email
	if _, exists := r.usersByName[user.Username]; exists {
		return nil, errors.New("username already exists")
	}
	if _, exists := r.usersByEmail[user.Email]; exists {
		return nil, errors.New("email already exists")
	}

	// Сохраняем пользователя
	r.users[user.ID] = user
	r.passwords[user.ID] = hashedPassword
	r.usersByName[user.Username] = user.ID
	r.usersByEmail[user.Email] = user.ID

	return user, nil
}

func (r *UserRepository) GetByID(id string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	userID, exists := r.usersByName[username]
	if !exists {
		return nil, errors.New("user not found")
	}

	user, exists := r.users[userID]
	if !exists {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	userID, exists := r.usersByEmail[email]
	if !exists {
		return nil, errors.New("user not found")
	}

	user, exists := r.users[userID]
	if !exists {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (r *UserRepository) GetByUsernameWithPassword(username string) (*models.User, string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	userID, exists := r.usersByName[username]
	if !exists {
		return nil, "", errors.New("user not found")
	}

	user, exists := r.users[userID]
	if !exists {
		return nil, "", errors.New("user not found")
	}

	password, exists := r.passwords[userID]
	if !exists {
		return nil, "", errors.New("password not found")
	}

	return user, password, nil
}

func (r *UserRepository) Update(user *models.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[user.ID]; !exists {
		return errors.New("user not found")
	}

	user.UpdatedAt = time.Now()
	r.users[user.ID] = user

	return nil
}