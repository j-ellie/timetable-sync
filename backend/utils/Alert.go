package utils

import (
	"encoding/json"
	"fmt"
	"os"
)

type Alert struct {
	Active      bool   `json:"active"`
	Level       string `json:"level"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func ReadAlert() (Alert, error) {
	// Read the file content
	bytes, err := os.ReadFile("alert.json")
	if err != nil {
		return Alert{}, fmt.Errorf("failed to read file: %w", err)
	}

	// Decode JSON
	var alert Alert
	if err := json.Unmarshal(bytes, &alert); err != nil {
		return Alert{}, fmt.Errorf("failed to decode JSON: %w", err)
	}

	return alert, nil
}
