package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
	"sort"
)

type Room struct {
	Name string `json:"name"`
	ID string `json:"id"`
	Available bool `json:"available"`
}

type Event struct {
	Began time.Time `json:"began"`
	Ends time.Time `json:"ends"`
	Description string `json:"description"`
	Module string `json:"module"`
}

type RawEvent struct {
	Began time.Time `json:"began"`
	Ends time.Time `json:"ends"`
	EventName string `json:"event_name"`
	Module string `json:"module"`
}

type Returnable struct {
	RoomID string `json:"id"`
	Available bool `json:"available"`
	Until time.Time `json:"until"`
	OccupiedBy Event `json:"occupiedBy"`
	NextEvent Event `json:"nextEvent"`
}

type StoredRoom struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

func getTodayTime() (time.Time, time.Time) {
	currentTime := time.Now().AddDate(0, 0, 5)
	tomorrow := currentTime.AddDate(0,0,1)
	return currentTime, tomorrow
}

func GetRoom(targetRoom string, targetTime string) (Returnable, error){
	parseTimeFormat := "Mon Jan 02 2006 @ 15:04:05"

	var identity string
	var categoryIdentity string

	// currentTime, tomorrow := getTodayTime()
	timeFormat := "2006-01-02"

	parsedTime, err := time.Parse(parseTimeFormat, targetTime)
	if err != nil {
		return Returnable{}, err
	}

	fmt.Println(targetRoom, parsedTime)

	jsonFile, err := os.Open("lists/rooms.json")
	if err != nil {
		return Returnable{}, err
	}

	defer jsonFile.Close()

	var storedRooms []StoredRoom
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&storedRooms)
	if err != nil {
		return Returnable{}, err
	}
	for _, room := range storedRooms {
		if room.ID == targetRoom {
			identity = room.Identity
			categoryIdentity = room.CategoryTypeIdentity
			break
		}
	}

	if identity == "" || categoryIdentity == "" {
		return Returnable{}, fmt.Errorf("Room does not exist.")
	}

	fmt.Println(identity, categoryIdentity)

	// fmt.Println(currentTime, tomorrow)
	
	url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/Categories/Events/Filter/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177" + "?startRange="+ parsedTime.Format(timeFormat) + "&endRange=" + parsedTime.AddDate(0, 0, 1).Format(timeFormat)

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
		return Returnable{}, err
	}
	req, err2 := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyBytes))
	if err2 != nil {
		println("[getRoom] Error creating request: ", err)
		return Returnable{}, err
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
		return Returnable{}, err
	}

	defer resp.Body.Close()

	fmt.Println(resp.StatusCode)

	// Decode the response JSON
	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		fmt.Println("Error decoding JSON:", err)
		return Returnable{}, err
	}

	fmt.Println(data)

	categoryEvents, ok := data["CategoryEvents"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getRoom] No CategoryEvents found in the response.")
		return Returnable{}, nil
	}

	results, ok := categoryEvents[0].(map[string]interface{})["Results"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getRoom] No Results found in the response.")
		return Returnable{}, nil
	}

	returnableRoom := Returnable{
		RoomID: targetRoom,
		Available: true,
	}

	nextComplete := false

	var rawResults []RawEvent

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

		eventName, ok := event["Name"].(string)
		if !ok {
			eventName = "N/A"
		}

		module, ok := event["ExtraProperties"].([]interface{})
		var moduleName string
		if ok {
			moduleName, err = extractModuleName(module)
			if err != nil {
				moduleName = eventName
			}

		} else {
			moduleName = eventName
		}

		timeFormat := "2006-01-02T15:04:05-07:00"
		startTime, stErr := time.Parse(timeFormat, startTimeStr)
		endTime, etErr := time.Parse(timeFormat, endDateTimeStr)
		if stErr != nil || etErr != nil {
			fmt.Println("[TIMETABLE TIME ERROR]", stErr, etErr)
			continue
		}

		newEvent := RawEvent{
			Began: startTime,
			Ends: endTime,
			EventName: eventName,
			Module: moduleName,
		}

		rawResults = append(rawResults, newEvent)
	}

	// TODO: Sort raw results by time

	sort.SliceStable(rawResults, func(i, j int) bool {
		return rawResults[i].Began.Before(rawResults[j].Began)
	})

	for _, event := range rawResults {
		startTime := event.Began
		endTime := event.Ends
		moduleName := event.Module
		eventName := event.EventName

		fmt.Println("-", nextComplete)
		fmt.Println(parsedTime)
		fmt.Println(startTime)
		fmt.Println(endTime)
		fmt.Println("-")

		if startTime.Equal(parsedTime) || (parsedTime.After(startTime) && parsedTime.Before(endTime)) {
			returnableRoom.Available = false
			returnableRoom.Until = endTime
			returnableRoom.OccupiedBy.Description = moduleName
			returnableRoom.OccupiedBy.Began = startTime
			returnableRoom.OccupiedBy.Ends = endTime
			returnableRoom.OccupiedBy.Module = eventName
			nextComplete = false
		} else if (!nextComplete && startTime.After(parsedTime)) {
			returnableRoom.NextEvent.Began = startTime
			returnableRoom.NextEvent.Ends = endTime
			returnableRoom.NextEvent.Description = moduleName
			returnableRoom.NextEvent.Module = eventName
			nextComplete = true
		}

	}

	fmt.Println(returnableRoom.NextEvent)
	// TODO: fix error above here in line 242 	
	if !nextComplete || returnableRoom.NextEvent.Ends.Before(parsedTime) {
		fmt.Println("REMOVING!!!!!!", nextComplete, returnableRoom.NextEvent.Ends.Before(parsedTime))
		returnableRoom.NextEvent = Event{}
	}

	return returnableRoom, nil
}

func GetFreeRoomsInBuilding(buildingName string, targetTime string) ([]Returnable, error) {
	jsonFile, err := os.Open("lists/rooms.json")
	if err != nil {
		return nil, err
	}

	defer jsonFile.Close()

	var rooms []StoredRoom
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&rooms)
	if err != nil {
		return nil, err
	}
	var returnables []Returnable
	for _, room := range rooms {
		if strings.HasPrefix(room.ID, buildingName) {
			fmt.Println(room.ID)
			curr, err := GetRoom(room.ID, targetTime)

			if err == nil && curr.Available {
				returnables = append(returnables, curr)
			}
		}
		// ids = append(ids, room.ID + " - " + room.FriendlyName)
	}
	fmt.Println(returnables)
	fmt.Println(len(returnables))
	return returnables, nil
}

func GetAllRooms() ([]string, error) {
	jsonFile, err := os.Open("lists/rooms.json")
	if err != nil {
		return nil, err
	}

	defer jsonFile.Close()

	var rooms []StoredRoom
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&rooms)
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, room := range rooms {
		ids = append(ids, room.ID + " - " + room.FriendlyName)
	}
	return ids, nil
}

func GetBuildings() ([]string, error) {
	jsonFile, err := os.Open("lists/buildings.json")
	if err != nil {
		return nil, err
	}

	defer jsonFile.Close()

	var buildings []string
	decoder := json.NewDecoder(jsonFile)
	err = decoder.Decode(&buildings)
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, b := range buildings {
		ids = append(ids, b)
	}
	return ids, nil
}