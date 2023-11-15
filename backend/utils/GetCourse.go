package utils

import (
	"encoding/json"
	"os"
	"fmt"
)

type Course struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func GetAllCodes() ([]string, error) {
	jsonFile, err := os.Open("courses.json")
	if err != nil {
		return nil, err
	}

	defer jsonFile.Close()

	var courses []Course
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&courses)
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, course := range courses {
		ids = append(ids, course.ID)
	}
	return ids, nil
}

func GetCourseId(courseStr string) (string, string, error) {
	jsonFile, err := os.Open("courses.json")
	if err != nil {
		return "", "", err
	}

	defer jsonFile.Close()

	var courses []Course
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&courses)
	if err != nil {
		return "nil", "nil", err
	}
	for _, course := range courses {
		if course.ID == courseStr {
			return course.Identity, course.CategoryTypeIdentity, nil
		}
	}
	return "", "", fmt.Errorf("Course not found.")
}