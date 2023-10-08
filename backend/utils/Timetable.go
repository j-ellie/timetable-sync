package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)


type Timetable struct {
	Name          string
	StartDateTime time.Time
	EndDateTime   time.Time
	Location      string
	Description   string
	Staff         string
}

// function returns timetable from given course code from current time to next 2 weeks
func getTimetable(courseCode string, userEmail string, userToken string) []Timetable {
	var returnedTimetable []Timetable

	url := os.Getenv("DCU_TIMETABLE_BASE") + "?startRange=2023-10-02&endRange=2023-10-06"

	// request body conversion from Node.JS to Go with aid of ChatGPT V3.5
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
				"CategoryTypeIdentity": "241e4d36-60e0-49f8-b27e-99416745d98d",
				"CategoryIdentities":   []string{"db214724-e16c-82a1-8b07-5edb97d78f2d"},
			},
		},
		"FetchBookings":       false,
		"FetchPersonalEvents": false,
		"PersonalIdentities":  []interface{}{},
	}

	requestBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		println("[getTimetable] Error creating request body: ", err)
		return nil
	}
	req, err2 := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyBytes))
	if err2 != nil {
		println("[getTimetable] Error creating request: ", err)
		return nil
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
		fmt.Println("[getTimetable] Error sending request: ", err)
		return nil
	}

	defer resp.Body.Close()

	// Decode the response JSON
	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		fmt.Println("Error decoding JSON:", err)
		return nil
	}

	categoryEvents, ok := data["CategoryEvents"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getTimetable] No CategoryEvents found in the response.")
		return nil
	}

	results, ok := categoryEvents[0].(map[string]interface{})["Results"].([]interface{})
	// results, ok := data["Results"].([]interface{})
	if !ok || len(categoryEvents) == 0 {
		fmt.Println("[getTimetable] No Results found in the response.")
		return nil
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
		location, ok := event["Location"].(string)
		if !ok {
			location = "N/A"
		}
		description, ok := event["Description"].(string)
		if !ok {
			description = "N/A"
		}

		staff, ok := event["ExtraProperties"].([]interface{})
		var staffName string
		if ok {
			staffName, err = extractStaffMemberName(staff)
			if err != nil {
				staffName = err.Error()
			}

		} else {
			staffName = "DCU Staff Member"
		}

		startTimeStr, ok := event["StartDateTime"].(string)
		if !ok {
			startTimeStr = "N/A"
		}
		endDateTimeStr, ok := event["EndDateTime"].(string)
		if !ok {
			endDateTimeStr = "N/A"
		}

		// fmt.Println(name, location, staffName, description, startTimeStr, endDateTimeStr)
		// fmt.Println(" ")

		timeFormat := "2006-01-02T15:04:05-07:00"
		startTime, stErr := time.Parse(timeFormat, startTimeStr)
		endTime, etErr := time.Parse(timeFormat, endDateTimeStr)
		if stErr != nil || etErr != nil {
			fmt.Println("[TIMETABLE TIME ERROR]", name, stErr, etErr)
			continue
		}

		entry := Timetable{
			Name:          name,
			Location:      location,
			Description:   description,
			Staff:         staffName,
			StartDateTime: startTime,
			EndDateTime:   endTime,
		}
		returnedTimetable = append(returnedTimetable, entry)

	}

	return returnedTimetable

}