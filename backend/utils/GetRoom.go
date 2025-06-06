package utils

import (
	localcache "TimetableSync/cache"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type Room struct {
	Name      string `json:"name"`
	ID        string `json:"id"`
	Available bool   `json:"available"`
}

type Event struct {
	Began       time.Time `json:"began"`
	Ends        time.Time `json:"ends"`
	Description string    `json:"description"`
	Module      string    `json:"module"`
}

type RawEvent struct {
	Began     time.Time `json:"began"`
	Ends      time.Time `json:"ends"`
	EventName string    `json:"event_name"`
	Module    string    `json:"module"`
}

type Returnable struct {
	RoomID     string    `json:"id"`
	Available  bool      `json:"available"`
	Until      time.Time `json:"until"`
	OccupiedBy Event     `json:"occupiedBy"`
	NextEvent  Event     `json:"nextEvent"`
	Cached     bool      `json:"cached"`
}

func getTodayTime() (time.Time, time.Time) {
	currentTime := time.Now().AddDate(0, 0, 5)
	tomorrow := currentTime.AddDate(0, 0, 1)
	return currentTime, tomorrow
}

func GetRoomId(roomStr string) (string, string, error) {
	rooms := localcache.GetRooms()

	for _, room := range rooms {
		if room.ID == strings.Split(roomStr, " - ")[0] {
			return room.Identity, room.CategoryTypeIdentity, nil
		}
	}
	return "", "", fmt.Errorf("Course not found.")
}

func GetRoom(targetRoom string, targetTime string) (Returnable, error) {
	fmt.Println(targetRoom, ">> Getting room status started...")

	// parseTimeFormat := "Mon Jan 02 2006 @ 15:04:05" old format
	parseTimeFormat := "Mon, 02 Jan 2006 15:04:05 MST"

	var identity string
	var categoryIdentity string

	// currentTime, tomorrow := getTodayTime()
	timeFormat := "2006-01-02"

	parsedTime, err := time.Parse(parseTimeFormat, targetTime)
	if err != nil {
		return Returnable{}, err
	}
	parsedTime = parsedTime.UTC()
	cacheTime := time.Date(parsedTime.Year(), parsedTime.Month(), parsedTime.Day(), 8, 0, 0, 0, parsedTime.Location())

	var rawResults []RawEvent

	returnableRoom := Returnable{
		RoomID:    targetRoom,
		Available: true,
	}

	nextComplete := false

	cache, cacheErr := CheckCache(targetRoom, parsedTime)
	if cacheErr == nil {
		// present in the cache
		rawResults = cache
		fmt.Println("Using Cache")
		returnableRoom.Cached = true
	} else {
		// not cached or it errored
		fmt.Println("Not using Cache")
		storedRooms := localcache.GetRooms()

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

		url := "https://scientia-eu-v4-api-d1-03.azurewebsites.net/api/Public/CategoryTypes/Categories/Events/Filter/a1fdee6b-68eb-47b8-b2ac-a4c60c8e6177" + "?startRange=" + cacheTime.Format(timeFormat) + "&endRange=" + cacheTime.AddDate(0, 0, 1).Format(timeFormat)

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
						"StartDateTime": "2024-09-09T00:00:00+00:00",
						"EndDateTime":   "2024-09-16T00:00:00+00:00",
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

		// Decode the response JSON
		var data map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&data)
		if err != nil {
			fmt.Println("Error decoding JSON:", err)
			return Returnable{}, err
		}

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

		for _, event := range results {
			event, ok := event.(map[string]interface{})
			if !ok {
				fmt.Println("Invalid event format")
				continue
			}
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
				Began:     startTime,
				Ends:      endTime,
				EventName: eventName,
				Module:    moduleName,
			}

			rawResults = append(rawResults, newEvent)
		}

		sort.SliceStable(rawResults, func(i, j int) bool {
			return rawResults[i].Began.Before(rawResults[j].Began)
		})
	}

	for _, event := range rawResults {
		startTime := event.Began
		endTime := event.Ends
		moduleName := event.Module
		eventName := event.EventName

		if startTime.Equal(parsedTime) || (parsedTime.After(startTime) && parsedTime.Before(endTime)) {
			returnableRoom.Available = false
			returnableRoom.Until = endTime
			returnableRoom.OccupiedBy.Description = moduleName
			returnableRoom.OccupiedBy.Began = startTime
			returnableRoom.OccupiedBy.Ends = endTime
			returnableRoom.OccupiedBy.Module = eventName
			nextComplete = false
		} else if !nextComplete && startTime.After(parsedTime) {
			returnableRoom.NextEvent.Began = startTime
			returnableRoom.NextEvent.Ends = endTime
			returnableRoom.NextEvent.Description = moduleName
			returnableRoom.NextEvent.Module = eventName
			nextComplete = true
		}

	}

	if !nextComplete || returnableRoom.NextEvent.Ends.Before(parsedTime) {
		returnableRoom.NextEvent = Event{}
	}
	fmt.Println(targetRoom, ">> Getting room status complete.")

	if cache == nil {
		fmt.Println(targetRoom, ">> Caching...")
		cacheErr = CacheRooms(targetRoom, cacheTime, rawResults)
		if cacheErr != nil {
			fmt.Println(targetRoom, ">> Failed to Cache Error: ", cacheErr.Error())
		}
	}

	return returnableRoom, nil
}

func GetFreeRoomsInBuilding(buildingName string, targetTime string) ([]Returnable, error) {
	rooms := localcache.GetRooms()

	var returnables []Returnable
	for _, room := range rooms {
		if strings.HasPrefix(room.ID, buildingName) {
			curr, err := GetRoom(room.ID, targetTime)

			if err == nil && curr.Available {
				returnables = append(returnables, curr)
			}
		}
	}
	return returnables, nil
}

func StreamGetFreeRoomsInBuilding(c echo.Context, buildingName string, targetTime string) ([]Returnable, error) {
	rooms := localcache.GetRooms()

	c.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
	c.Response().Header().Set(echo.HeaderCacheControl, "no-cache")
	c.Response().Header().Set(echo.HeaderConnection, "keep-alive")
	c.Response().Header().Set("X-Accel-Buffering", "no")
	c.Response().WriteHeader(http.StatusOK)

	var response struct {
		Data Returnable `json:"data"`
	}

	buffer := &bytes.Buffer{}

	var returnables []Returnable
	for _, room := range rooms {
		if strings.HasPrefix(room.ID, buildingName) {
			curr, err := GetRoom(room.ID, targetTime)

			if err == nil && curr.Available {
				returnables = append(returnables, curr)

				response.Data = curr

				buffer.Reset()

				buffer.WriteString("event: message\n")
				data, err := json.Marshal(curr)
				if err != nil {
					return nil, err
				}
				buffer.WriteString("data:")
				buffer.Write(data)
				buffer.WriteString("\n\n")

				c.Response().Write(buffer.Bytes())
				c.Response().Flush()
			}
		}
	}

	buffer.Reset()
	buffer.WriteString("event: end\n")
	buffer.WriteString("data: no")
	buffer.WriteString("\n\n")
	c.Response().Write(buffer.Bytes())

	return returnables, nil
}

func GetAllRooms() ([]string, error) {
	rooms := localcache.GetRooms()

	var ids []string
	for _, room := range rooms {
		ids = append(ids, room.ID+" - "+room.FriendlyName)
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

	ids = append(ids, buildings...)
	// for _, b := range buildings {
	// 	ids = append(ids, b)
	// }
	return ids, nil
}
