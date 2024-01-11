package utils

import (
	"os"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"bytes"
)

type Room struct {
	Name string `json:"name"`
	Number string `json:"number"`
	ID string `json:"id"`
	Description string `json:"description"`
	Available bool `json:"available"`
}

type StoredRoom struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func getTodayTime() (time.Time, time.Time) {
	currentTime := time.Now()
	tomorrow := currentTime.AddDate(0,0,1)
	return currentTime, tomorrow
}

func GetRoom(targetRoom string) (Room, error){
	var identity string
	var categoryIdentity string

	currentTime, tomorrow := getTodayTime()
	timeFormat := "2006-01-02"

	jsonFile, err := os.Open("rooms.json")
	if err != nil {
		return Room{}, err
	}

	defer jsonFile.Close()

	var storedRooms []StoredRoom
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&storedRooms)
	if err != nil {
		return Room{}, err
	}
	for _, room := range storedRooms {
		if room.ID == targetRoom {
			identity = room.Identity
			categoryIdentity = room.CategoryTypeIdentity
			break
		}
	}

	fmt.Println(identity, categoryIdentity)
	
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/Categories/Events/Filter/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177" + "?startRange="+ currentTime.Format(timeFormat) + "&endRange=" + tomorrow.Format(timeFormat)

	requestBody := map[string]interface{}{
		"ViewOptions": map[string]interface{}{
			"Days": []map[string]interface{}{
				{"Name": "Monday", "DayOfWeek": 1, "IsDefault": true},
				{"Name": "Tuesday", "DayOfWeek": 2, "IsDefault": true},
				{"Name": "Wednesday", "DayOfWeek": 3, "IsDefault": true},
				{"Name": "Thursday", "DayOfWeek": 4, "IsDefault": true},
				{"Name": "Friday", "DayOfWeek": 5, "IsDefault": true},
			},
			"Weeks": []interface{}{},
			"TimePeriods": []map[string]interface{}{
				{"Description": "All Day", "StartTime": "00:00", "EndTime": "23:59", "IsDefault": true},
			},
			"DatePeriods": []map[string]interface{}{
				{
					"Description":   "This Week",
					"StartDateTime": "2023-09-11T00:00:00+00:00",
					"EndDateTime":   "2024-09-08T00:00:00+00:00",
					"IsDefault":     true,
					"Type":          nil,
					"Weeks":         []map[string]interface{}{},
				},
			},
		},
		"CategoryTypesWithIdentities": []map[string]interface{}{
			{
				"CategoryTypeIdentity": categoryIdentity,
				"CategoryIdentities":   []string{identity},
			},
		},
		"FetchBookings":       false,
		"FetchPersonalEvents": false,
		"PersonalIdentities":  []interface{}{},
	}

	requestBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		println("[getRoom] Error creating request body: ", err)
		return Room{}, err
	}
	req, err2 := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyBytes))
	if err2 != nil {
		println("[getRoom] Error creating request: ", err)
		return Room{}, err
	}
	req.Header.Set("accept", "application/json, text/plain, */*")
	req.Header.Set("accept-language", "en-US,en;q=0.9")
	req.Header.Set("authorization", "Anonymous")
	req.Header.Set("cache-control", "no-cache")
	req.Header.Set("pragma", "no-cache")
	req.Header.Set("content-type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		fmt.Println("[getRoom] Error sending request: ", err)
		return Room{}, err
	}

	defer resp.Body.Close()

	fmt.Println(resp.StatusCode)

	// Decode the response JSON
	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		fmt.Println("Error decoding JSON:", err)
		return Room{}, err
	}

	categoryEvents, ok := data["CategoryEvents"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getRoom] No CategoryEvents found in the response.")
		return Room{}, nil
	}

	results, ok := categoryEvents[0].(map[string]interface{})["Results"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getRoom] No Results found in the response.")
		return Room{}, nil
	}

	for _, event := range results {
		event, ok := event.(map[string]interface{})
		if !ok {
			fmt.Println("Invalid event format")
			continue
		}
		fmt.Println(event)
		startTimeStr, ok := event["StartDateTime"].(string)
		if !ok {
			startTimeStr = "N/A"
		}
		endDateTimeStr, ok := event["EndDateTime"].(string)
		if !ok {
			endDateTimeStr = "N/A"
		}


		timeFormat := "2006-01-02T15:04:05-07:00"
		startTime, stErr := time.Parse(timeFormat, startTimeStr)
		endTime, etErr := time.Parse(timeFormat, endDateTimeStr)
		if stErr != nil || etErr != nil {
			fmt.Println("[TIMETABLE TIME ERROR]", stErr, etErr)
			continue
		}

		if startTime.After(time.Now()) && endTime.Before(time.Now()) {
			roomToReturn = Room{
				Name: targetRoom,
				Available: false,
			}
		}

		return Room{}, nil
	}

	return Room{}, nil
}