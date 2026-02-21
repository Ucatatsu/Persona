package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

func Connect() (*sql.DB, error) {
	// Check if we should use SQLite
	useSQLite := os.Getenv("USE_SQLITE")
	if useSQLite == "true" || os.Getenv("DB_HOST") == "" {
		return ConnectSQLite()
	}

	// Use PostgreSQL
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func Migrate(db *sql.DB) error {
	// Check if we're using SQLite
	if os.Getenv("USE_SQLITE") == "true" || os.Getenv("DB_HOST") == "" {
		return MigrateSQLite(db)
	}
	
	// PostgreSQL migrations - call from migrations.go
	return migratePostgreSQL(db)
}

