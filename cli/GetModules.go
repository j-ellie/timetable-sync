package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

type Module struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func main() {
	pages := getTotalPages()
	// fmt.Println(pages)

	var modules []Module

	for i := 0; i < int(pages); i++ {
		page := i + 1	
		// log.Println(page)
		mod := getCoursePage(page)
		for _, c := range mod {
			modules = append(modules, c)
		}
	}
	for _, c := range modules {
		fmt.Printf(c.ID + " ")
	}
	log.Println(len(modules))
	jsonData, err := json.Marshal(modules)
	if err != nil {
		log.Fatal(err)
	}

	jsonFile, err := os.Create("modules.json")
	if err != nil {
		log.Fatal(err)
	}

	defer jsonFile.Close()

	_, fileErr := jsonFile.Write(jsonData)
	if fileErr != nil {
		log.Fatal(err)
	}
}

func getCoursePage(page int) []Module {
	log.Println(fmt.Sprintf("%v", page))
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/525fe79b-73c3-4b5c-8186-83c652b3adcc/Categories/FilterWithCache/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177?pageNumber=" + fmt.Sprintf("%v", page)

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
	// log.Fatalln(data)

	// results, ok := data["Results"].([]interface{})
	// if !ok || len(categoryEvents) == 0 {
	// 	log.Fatal("No Results found in the response.")
	// 	return nil
	// }

	var courses []Module

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
		newModule := Module{
			FriendlyName: description,
			ID: name,
			Identity: identity,
			CategoryTypeIdentity: categoryIdentity,
		}

		if !contains(courses, newModule.ID) {
			courses = append(courses, newModule)
		} 

		// log.Fatalln(event)


	// name, ok := results["Name"].(string)
	// if !ok {
	// 	name = "N/A"
	}
	// log.Println(courses)
	// log.Println(len(courses))
	return courses
}

func getTotalPages() float64 {
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/525fe79b-73c3-4b5c-8186-83c652b3adcc/Categories/FilterWithCache/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177"

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

func contains(lst []Module, elem string) bool {
	for _, a := range lst {
		if a.ID == elem {
			return true
		}
	}
	return false
}