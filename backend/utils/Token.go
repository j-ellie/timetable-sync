package utils

import (
	"encoding/json"
	"time"
	"os"
	"golang.org/x/oauth2"
)

type Token struct {
	AccessToken string `json:"access_token"`
	TokenType string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	Expiry time.Time `json:"expiry"`
}

func Save(token *oauth2.Token, filename string) error {
	tokenJSON, err := json.Marshal(token)
	if err != nil {
		return err
	}

	err = os.WriteFile("./data/" + filename, tokenJSON, 0600)
	if err != nil {
		return err
	}

	return nil

}

func Read(filename string) (*Token, error) {
	tokenJSON, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var token Token
	err = json.Unmarshal(tokenJSON, &token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}