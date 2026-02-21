package utils

import (
	"os"
	"regexp"
)

// AdaptQuery adapts a PostgreSQL query (using $1, $2, etc.) for SQLite (using ?1, ?2, etc.) if needed.
// It checks the USE_SQLITE environment variable or if DB_HOST is empty.
func AdaptQuery(query string) string {
	useSQLite := os.Getenv("USE_SQLITE")
	if useSQLite == "true" || os.Getenv("DB_HOST") == "" {
		// SQLite supports ?NNN for positional arguments, which allows reusing arguments just like $NNN.
		// We simply replace $ with ? for the placeholders.
		re := regexp.MustCompile(`\$(\d+)`)
		return re.ReplaceAllString(query, "?$1")
	}
	return query
}
