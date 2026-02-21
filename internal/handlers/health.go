package handlers

import (
	"net/http"

	"github.com/kvant/messenger/pkg/utils"
)

const (
	Version     = "2H1C1S"
	ReleaseDate = "2026-01-24"
	VersionEra  = "Horse" // Chinese Zodiac Year
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "persona-messenger",
		"version": Version,
		"release": ReleaseDate,
		"era":     VersionEra,
	})
}

func GetVersion(w http.ResponseWriter, r *http.Request) {
	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"version":      Version,
		"release_date": ReleaseDate,
		"era":          VersionEra,
		"status":       "stable",
		"system":       "PVS",
	})
}
