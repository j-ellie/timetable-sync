package utils

import (
	"encoding/json"
	"io"
	"net/http"
)

type GoogleUserInfo struct {
	FirstName string `json:"given_name"`
	Email string `json:"email"`
	PictureURL string `json:"picture"`
	ID string `json:"id"`
}

// Sourced from Google Oauth API docs: https://developers.google.com/
func GetGoogleUser(userToken string) (GoogleUserInfo, error) {
	endpoint := "https://www.googleapis.com/oauth2/v1/userinfo"
	emptyUserInfo := GoogleUserInfo{}

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return emptyUserInfo, err
	}
	req.Header.Set("Authorization", "Bearer "+userToken)

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return emptyUserInfo, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return emptyUserInfo, err
	}

	// Parse the JSON response
	var userInfo GoogleUserInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		return emptyUserInfo, err
	}
	return userInfo, nil 
}