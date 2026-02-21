package database

import (
	"database/sql"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func ConnectSQLite() (*sql.DB, error) {
	dbPath := os.Getenv("SQLITE_DB_PATH")
	if dbPath == "" {
		dbPath = "./kvant.db"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Enable foreign keys
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, err
	}

	log.Printf("✅ Connected to SQLite database: %s", dbPath)
	return db, nil
}

func MigrateSQLite(db *sql.DB) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			display_name TEXT,
			bio TEXT,
			avatar_url TEXT,
			banner_url TEXT,
			role TEXT DEFAULT 'user',
			is_premium INTEGER DEFAULT 0,
			premium_until DATETIME,
			name_color TEXT,
			profile_theme TEXT DEFAULT 'default',
			bubble_style TEXT DEFAULT 'default',
			hide_online INTEGER DEFAULT 0,
			status TEXT DEFAULT 'online',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		// Messages table
		`CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			sender_id TEXT NOT NULL,
			receiver_id TEXT NOT NULL,
			text TEXT NOT NULL,
			message_type TEXT DEFAULT 'text',
			file_url TEXT,
			is_read INTEGER DEFAULT 0,
			reply_to_id TEXT,
			self_destruct_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME,
			pinned_at DATETIME,
			FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Indexes for messages
		`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`,

		// Reactions table
		`CREATE TABLE IF NOT EXISTS reactions (
			id TEXT PRIMARY KEY,
			message_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			emoji TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE(message_id, user_id, emoji)
		)`,

		// Groups table
		`CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			avatar_url TEXT,
			owner_id TEXT NOT NULL,
			is_public INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Group members table
		`CREATE TABLE IF NOT EXISTS group_members (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			role TEXT DEFAULT 'member',
			joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE(group_id, user_id)
		)`,

		// Channels table
		`CREATE TABLE IF NOT EXISTS channels (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			avatar_url TEXT,
			owner_id TEXT NOT NULL,
			is_public INTEGER DEFAULT 1,
			subscriber_count INTEGER DEFAULT 0,
			invite_slug TEXT UNIQUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// Servers table
		`CREATE TABLE IF NOT EXISTS servers (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			icon_url TEXT,
			banner_url TEXT,
			owner_id TEXT NOT NULL,
			is_public INTEGER DEFAULT 1,
			member_count INTEGER DEFAULT 0,
			invite_slug TEXT UNIQUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			log.Printf("Migration error: %v", err)
			return err
		}
	}

	// Add read_at column to messages if not exists (safe migration)
	var columnExists bool
	err := db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='read_at'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN read_at DATETIME`); err != nil {
			log.Printf("Warning: Could not add read_at column: %v", err)
		}
	}

	// Add edited_at column to messages if not exists (safe migration)
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='edited_at'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN edited_at DATETIME`); err != nil {
			log.Printf("Warning: Could not add edited_at column: %v", err)
		}
	}

	// Add deleted_at column to messages if not exists
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='deleted_at'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN deleted_at DATETIME`); err != nil {
			log.Printf("Warning: Could not add deleted_at column: %v", err)
		}
	}

	// Add deleted_for_sender column to messages if not exists
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='deleted_for_sender'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN deleted_for_sender INTEGER DEFAULT 0`); err != nil {
			log.Printf("Warning: Could not add deleted_for_sender column: %v", err)
		}
	}

	// Add deleted_for_receiver column to messages if not exists
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='deleted_for_receiver'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN deleted_for_receiver INTEGER DEFAULT 0`); err != nil {
			log.Printf("Warning: Could not add deleted_for_receiver column: %v", err)
		}
	}

	// Add pinned_at column to messages if not exists
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='pinned_at'`).Scan(&columnExists)
	if err == nil && !columnExists {
		if _, err := db.Exec(`ALTER TABLE messages ADD COLUMN pinned_at DATETIME`); err != nil {
			log.Printf("Warning: Could not add pinned_at column: %v", err)
		}
	}

	log.Println("✅ SQLite database migrations completed")
	return nil
}
