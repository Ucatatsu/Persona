package database

import (
	"database/sql"
	"log"
)

func migratePostgreSQL(db *sql.DB) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			username VARCHAR(50) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			display_name VARCHAR(100),
			bio TEXT,
			avatar_url TEXT,
			banner_url TEXT,
			tag VARCHAR(10) UNIQUE,
			role VARCHAR(20) DEFAULT 'user',
			is_premium BOOLEAN DEFAULT FALSE,
			premium_until TIMESTAMP,
			name_color VARCHAR(7),
			profile_theme VARCHAR(50) DEFAULT 'default',
			bubble_style VARCHAR(50) DEFAULT 'default',
			hide_online BOOLEAN DEFAULT FALSE,
			status VARCHAR(20) DEFAULT 'online',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Messages table
		`CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			text TEXT NOT NULL,
			message_type VARCHAR(20) DEFAULT 'text',
			file_url TEXT,
			is_read BOOLEAN DEFAULT FALSE,
			reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
			self_destruct_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP,
			pinned_at TIMESTAMP
		)`,

		// Indexes for messages
		`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`,

		// Reactions table
		`CREATE TABLE IF NOT EXISTS reactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			emoji VARCHAR(10) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(message_id, user_id, emoji)
		)`,

		// Groups table
		`CREATE TABLE IF NOT EXISTS groups (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(100) NOT NULL,
			description TEXT,
			avatar_url TEXT,
			owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			is_public BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Group members table
		`CREATE TABLE IF NOT EXISTS group_members (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			role VARCHAR(20) DEFAULT 'member',
			joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(group_id, user_id)
		)`,

		// Channels table
		`CREATE TABLE IF NOT EXISTS channels (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(100) NOT NULL,
			description TEXT,
			avatar_url TEXT,
			owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			is_public BOOLEAN DEFAULT TRUE,
			subscriber_count INTEGER DEFAULT 0,
			invite_slug VARCHAR(50) UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Servers table
		`CREATE TABLE IF NOT EXISTS servers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(100) NOT NULL,
			description TEXT,
			icon_url TEXT,
			banner_url TEXT,
			owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			is_public BOOLEAN DEFAULT TRUE,
			member_count INTEGER DEFAULT 0,
			invite_slug VARCHAR(50) UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			log.Printf("Migration error: %v", err)
			return err
		}
	}

	log.Println("✅ Database migrations completed")
	return nil
}
