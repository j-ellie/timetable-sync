package utils

import (
	"encoding/json"
	"os"
	"fmt"
)

type Module struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

type StoredModule struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func GetModules() ([]string, error) {
	jsonFile, err := os.Open("lists/modules.json")
	if err != nil {
		return nil, err
	}

	defer jsonFile.Close()

	var modules []StoredModule
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&modules)
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, room := range modules {
		ids = append(ids, room.ID)
	}
	return ids, nil
}

func GetModuleId(moduleStr string) (string, string, error) {
	jsonFile, err := os.Open("lists/modules.json")
	if err != nil {
		return "", "", err
	}

	defer jsonFile.Close()

	var modules []Module
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&modules)
	if err != nil {
		return "nil", "nil", err
	}
	for _, mod := range modules {
		if mod.ID == moduleStr {
			return mod.Identity, mod.CategoryTypeIdentity, nil
		}
	}
	return "", "", fmt.Errorf("Module not found.")
}