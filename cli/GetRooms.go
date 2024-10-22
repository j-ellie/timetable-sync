package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

type Room struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func main() {
	pages := getTotalPages()
	// fmt.Println(pages)

	var rooms []Room

	for i := 0; i < int(pages); i++ {
		page := i + 1	
		// log.Println(page)
		room := getRoomPage(page)
		for _, c := range room {
			filteredName := strings.Replace(c.FriendlyName, " - ", " ~ ", -1)
			c.FriendlyName = filteredName
			rooms = append([]Room{c}, rooms...)
		}
	}
	for _, c := range rooms {
		fmt.Printf(c.ID + " ")
	}
	log.Println(len(rooms))
	jsonData, err := json.Marshal(rooms)
	if err != nil {
		log.Fatal(err)
	}

	jsonFile, err := os.Create("rooms.json")
	if err != nil {
		log.Fatal(err)
	}

	defer jsonFile.Close()

	_, fileErr := jsonFile.Write(jsonData)
	if fileErr != nil {
		log.Fatal(err)
	}
}

func getRoomPage(page int) []Room {
	log.Println(fmt.Sprintf("%v", page))
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/1e042cb1-547d-41d4-ae93-a1f2c3d34538/Categories/FilterWithCache/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177?pageNumber=" + fmt.Sprintf("%v", page)

	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	

	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		log.Fatal("Error decoding JSON:", err)
	}

	var rooms []Room

	results, ok := data["Results"].([]interface{})
	// results, ok := data["Results"].([]interface{})
	if !ok {
		log.Fatal("No Results found in the response.")
	}

	for _, event := range results {
		event, ok := event.(map[string]interface{})
		if !ok {
			fmt.Println("Invalid event format")
			continue
		}

		name, ok := event["Name"].(string)
		if !ok {
			name = "N/A"
		}
		description, ok := event["Description"].(string)
		if !ok {
			description = "N/A"
		}
		identity, ok := event["Identity"].(string)
		if !ok {
			identity = "N/A"
		}
		categoryIdentity, ok := event["CategoryTypeIdentity"].(string)
		if !ok {
			categoryIdentity = "N/A"
		}

		// log.Println(name, description, identity, categoryIdentity)
		newRoom := Room{
			FriendlyName: description,
			ID: name,
			Identity: identity,
			CategoryTypeIdentity: categoryIdentity,
		}

		rooms = append(rooms, newRoom)
		// log.Fatalln(event)


	// name, ok := results["Name"].(string)
	// if !ok {
	// 	name = "N/A"
	}
	// log.Println(courses)
	// log.Println(len(courses))
	return rooms
}

func getTotalPages() float64 {
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/1e042cb1-547d-41d4-ae93-a1f2c3d34538/Categories/FilterWithCache/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177"

	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	
	// log.Println("Status Code:", resp.StatusCode)

	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		log.Fatal("Error decoding JSON:", err)
	}

	// log.Println("Body:", data)

	totalPages, ok := data["TotalPages"].(interface{})
	if !ok {
		log.Fatal("No total pages found in response.")
	}
	// log.Println(totalPages)
	pages := totalPages.(float64)
	// pages, _ := fmt.Fprintf("%v", totalPages)
	return pages
}