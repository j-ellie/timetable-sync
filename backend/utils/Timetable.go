package utils

import (
	"TimetableSync/models"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)


type Timetable struct {
	Name          string
	StartDateTime time.Time
	EndDateTime   time.Time
	Location      string
	Description   string
	Staff         string
}

type EventColor struct {
	ModuleName string
	ColorId    string
}

func getTime() (time.Time, time.Time) {
	currentTime := time.Now()
	twoWeeks := currentTime.AddDate(0,0,14)
	return currentTime, twoWeeks
}

// function returns timetable from given course code from current time to next 2 weeks
func getTimetable(courseCode string, ignoredEvents []string) []Timetable {
	var returnedTimetable []Timetable

	courseId, categoryId, cErr := GetCourseId(courseCode)
	if cErr != nil {
		fmt.Println("Failed to convert course code: ", cErr)
		return nil
	}

	currentTime, twoWeeks := getTime()
	timeFormat := "2006-01-02"

	url := os.Getenv("DCU_TIMETABLE_BASE") + "?startRange="+ currentTime.Format(timeFormat) + "&endRange=" + twoWeeks.Format(timeFormat)

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
		// this is where the program of study is defined (TODO)
		"CategoryTypesWithIdentities": []map[string]interface{}{
			{
				"CategoryTypeIdentity": categoryId,
				"CategoryIdentities":   []string{courseId},
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

		module, ok := event["ExtraProperties"].([]interface{})
		var moduleName string
		if ok {
			moduleName, err = extractModuleName(module)
			if err != nil {
				moduleName = name
			}

		} else {
			moduleName = name
		}

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
			fmt.Println("[TIMETABLE TIME ERROR]", name, stErr, etErr)
			continue
		}

		entry := Timetable{
			Name:          moduleName,
			Location:      location,
			Description:   description,
			Staff:         staffName,
			StartDateTime: startTime,
			EndDateTime:   endTime,
		}
		
		if entry.StartDateTime.Before(time.Now()) {
			continue
		} else if contains(ignoredEvents, name) == true {
			continue 
		} else {
			returnedTimetable = append(returnedTimetable, entry)
		}
	}

	return returnedTimetable

}

func extractStaffMemberName(extraProperties []interface{}) (string, error) {
	for _, property := range extraProperties {
		propertyMap, ok := property.(map[string]interface{})
		if !ok {
			return "", fmt.Errorf("ExtraProperties item has incorrect format")
		}

		displayName, displayNameExists := propertyMap["DisplayName"].(string)
		value, valueExists := propertyMap["Value"].(string)

		if displayNameExists && displayName == "Staff Member" && valueExists {
			return value, nil
		}
	}

	return "", fmt.Errorf("Staff Member Name not found")
}

func extractModuleName(extraProperties []interface{}) (string, error) {
	for _, property := range extraProperties {
		propertyMap, ok := property.(map[string]interface{})
		if !ok {
			return "", fmt.Errorf("ExtraProperties item has incorrect format")
		}

		displayName, displayNameExists := propertyMap["DisplayName"].(string)
		value, valueExists := propertyMap["Value"].(string)

		if displayNameExists && displayName == "Module Name" && valueExists {
			return value, nil
		}
	}

	return "", fmt.Errorf("Module Name not found")
}

func clearTimetable(calendar *calendar.Service, calendarID string) error {
	format := time.RFC3339
	current, twoWeeks := getTime()
	// events, err := calendar.Events.List(calendarID).Do()
	events, err := calendar.Events.List(calendarID).TimeMin(current.Format(format)).TimeMax(twoWeeks.Format(format)).SingleEvents(true).Do()
	if err != nil {
		return fmt.Errorf("Unable to list events: %v", err)
	}

	// fmt.Println("Deleting current events:")
	if len(events.Items) > 0 {
		for _, item := range events.Items {
			// fmt.Print(item.Summary)
			// continue
			if item.Source == nil {
				continue
			}
			// currentTime := time.Now()
			currentTime := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Local)
			eventStart := item.Start.DateTime
			eventTimeCode, _ := time.Parse(format, eventStart)

			if eventTimeCode.Before(currentTime) {
				continue
			}
			if item.Source.Title == "DCU (Timetable Sync)" {
				err := calendar.Events.Delete(calendarID, item.Id).Do()
				if err != nil {
					fmt.Println("Failed to delete event: ", err)
				}
				// fmt.Println("Deleted event: ", item.Id)
			}
		}
	} else {
		fmt.Println("No upcoming events found to delete.")
	}
	return nil
}

func SyncTimetable(config oauth2.Config, accessToken string, refreshToken string, tokenExpiry time.Time, userEmail string, courseCode string, sendEmail bool, ignoredEvents []string) error {
	fmt.Println(userEmail, ">> Starting syncing timetable...")
	token := oauth2.Token{
		AccessToken: accessToken,
		RefreshToken: refreshToken,
		TokenType: "Bearer",
		Expiry: tokenExpiry,
	}
	// client := config.Client(context.Background(), &token)

	ctx := context.Background()
// ERROR!!
	tokSource := config.TokenSource(ctx, &token)
	readyToken, tokErr := tokSource.Token()
	if tokErr != nil {
		return tokErr
	}
	if readyToken.AccessToken != token.AccessToken {
		update := bson.M{"$set": bson.M{
			"access_token": readyToken.AccessToken,
			"refresh_token": readyToken.RefreshToken,
			"expiry": readyToken.Expiry,
		}}
		var userCollection *mongo.Collection = GetCollections(DB, "users")
		_, dbErr4 := userCollection.UpdateOne(ctx, bson.M{"email" : userEmail}, update)
		if dbErr4 != nil {
			fmt.Println(dbErr4)
			return dbErr4
		}
	}

	srv, err := calendar.NewService(ctx, option.WithTokenSource(tokSource))
	
	if err != nil {
		fmt.Printf("Unable to create Calendar API service: %v", err)
		return err
	}
	timetable := getTimetable(courseCode, ignoredEvents)

	calendarID := "primary"
	clearErr := clearTimetable(srv, calendarID)
	if clearErr != nil {
		return clearErr
	}

	var colors []EventColor
	currentColorId := 0

	if len(timetable) == 0 {
		return nil
	}

	for _, event := range timetable {
		description := "Staff: " + event.Staff + " - Description: " + event.Description
		color := ""
		exists := false

		for _, eventColor := range colors {
			if eventColor.ModuleName == strings.Split(event.Name, "[")[0] {
				color = eventColor.ColorId
				exists = true
				break
			}
		}

		if !exists {
			if currentColorId == 12 {
				currentColorId = 1
			} else {
				currentColorId += 1
			}
			color = strconv.FormatInt(int64(currentColorId), 10)
			newColor := EventColor{
				ModuleName: strings.Split(event.Name, "[")[0] ,
				ColorId: color,
			}
			colors = append(colors, newColor)
		}

		newEvent := &calendar.Event{
			Summary:     event.Name,
			Description: description,
			Location:    event.Location,
			ColorId: color,

			Start: &calendar.EventDateTime{
				DateTime: event.StartDateTime.Format(time.RFC3339),
				TimeZone: "UTC",
			},
			End: &calendar.EventDateTime{
				DateTime: event.EndDateTime.Format(time.RFC3339),
				TimeZone: "UTC",
			},

			Source: &calendar.EventSource{
				Title: "DCU (Timetable Sync)",
				Url: "https://ts.jamesz.dev",
			},
		}

		inputtedEvent, err := srv.Events.Insert(calendarID, newEvent).Do()
		if err != nil {
			fmt.Printf("Unable to create event: %v", err)
			return err
		}

		// Print the event ID if successfully inserted
		fmt.Printf("Event created: %s\n", inputtedEvent.Id)
	}
	var userCollection *mongo.Collection = GetCollections(DB, "users")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()


	update := bson.M{"$set": bson.M{
		"last_sync": time.Now(),
	}}
	_, dbErr := userCollection.UpdateOne(ctx, bson.M{"email" : userEmail}, update)
	if dbErr != nil {
		fmt.Println(dbErr)
		return dbErr
	}
	
	if sendEmail == true {
		if len(timetable) == 0 {
			return nil
		}

		sort.SliceStable(timetable, func(i, j int) bool {
			return timetable[i].StartDateTime.Before(timetable[j].StartDateTime)
		})	

		var user models.User
		dbErr := userCollection.FindOne(ctx, bson.M{"email" : userEmail}).Decode(&user)

		emailErr := SendUpdate(user, timetable)
		if emailErr != nil || dbErr != nil {
			return emailErr
		}
	}
	fmt.Println(userEmail, ">> Completed syncing timetable.")
	return nil
}