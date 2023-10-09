package main

import (
	"TimetableSync/models"
	"TimetableSync/utils"
	"strings"

	// "bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	// "strconv"
	// "strings"
	// "time"
	"os"
	// "golang.org/x/oauth2/google"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file.")
	}

	config := oauth2.Config{
        ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
        RedirectURL:  "postmessage",
        Scopes:       []string{calendar.CalendarEventsScope, calendar.CalendarScope},
        Endpoint:     google.Endpoint,
    }

	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://127.0.0.1:5173", "http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost},
		AllowHeaders: []string{"*"},
	}))

	e.POST("/auth", func(c echo.Context) error {
		code := c.Request().Header.Get("code")

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message,omitempty"`
			UserData    *echo.Map `json:"data,omitempty"`
		}
		token, err := config.Exchange(context.Background(), code)
		if err != nil {
			fmt.Println("Error getting token: ", err)
			response.Success = false
			response.Message = "Failed to exchange token."
			return c.JSON(http.StatusBadRequest, response)
		}
		
		userInfo, err := utils.GetGoogleUser(token.AccessToken)

		if err != nil {
			response.Success = false
			response.Message = "Failed to retrieve user info from Google API."
			fmt.Println("Error getting user info: ", err)
			return c.JSON(http.StatusInternalServerError, response)
		}

		var userCollection *mongo.Collection = utils.GetCollections(utils.DB, "users")

		var user models.User

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		dbErr := userCollection.FindOne(ctx, bson.M{"email" : userInfo.Email}).Decode(&user)
		if dbErr != nil {
			if dbErr.Error() == "mongo: no documents in result" {
				newUser := models.User {
					ID: primitive.NewObjectID(),
					Email: userInfo.Email,
					GoogleID: userInfo.ID,
					FirstName: userInfo.FirstName,
					UserPicture: userInfo.PictureURL,
					AccessToken: token.AccessToken,
					RefreshToken: token.RefreshToken,
					Expiry: token.Expiry,
				}
				_, dbErr2 := userCollection.InsertOne(ctx, newUser)
				response.Success = true
				response.Message = "Logged in. (NEW USER)"
				response.UserData = &echo.Map{"data": newUser}
				
				if dbErr2 != nil {
					response.Success = false
					response.Message = "Database Error."
					return c.JSON(http.StatusInternalServerError, response)
				}
				return c.JSON(http.StatusOK, response)
			} else {
				fmt.Println("Failed to find documents:", dbErr.Error())
				response.Success = false
				response.Message = "Database Error."
				return c.JSON(http.StatusInternalServerError, response)
			}
		}
		update := bson.M{"$set": bson.M{
			"access_token": token.AccessToken,
			"refresh_token": token.RefreshToken,
			"expires": token.Expiry,
		}}
		_, dbErr4 := userCollection.UpdateOne(ctx, bson.M{"email" : userInfo.Email}, update)
		if dbErr4 != nil {
			fmt.Println(dbErr4)
			response.Success = false
			response.Message = "Database Error."
			return c.JSON(http.StatusInternalServerError, response)
		}
	
		user.AccessToken = token.AccessToken
		user.RefreshToken = token.RefreshToken

		response.Success = true
		response.Message = "Logged in. (EXISTING USER)"
		response.UserData = &echo.Map{"data": user}
		return c.JSON(http.StatusOK, response)
	})

	e.POST("/save", func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
		}

		var data models.User

		err := json.NewDecoder(c.Request().Body).Decode(&data)
		if err != nil {
			response.Success = false
			response.Message = "Error decoding request."
			return c.JSON(http.StatusBadRequest, response)
		}

		if auth != data.AccessToken {
			response.Success = false
			response.Message = "Unauthorized."
			return c.JSON(http.StatusUnauthorized, response)
		}

		gUser, gErr := utils.GetGoogleUser(auth)
		if gErr != nil {
			fmt.Println(gErr)
			response.Success = false
			response.Message = "Google Error. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}
		fmt.Println(gErr)
		fmt.Println(gUser)
		fmt.Println(data.Email)
		if gUser.Email != data.Email {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

		fmt.Println(data)
		var userCollection *mongo.Collection = utils.GetCollections(utils.DB, "users")


		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		dbRes := userCollection.FindOneAndReplace(ctx, bson.M{"email" : data.Email, "_id": data.ID, "google_id": data.GoogleID}, data)
		if dbRes.Err() != nil {
			fmt.Println(dbRes.Err())
			response.Success = false
			response.Message = "Database Error."
			return c.JSON(http.StatusUnauthorized, response)
		}

		if strings.HasPrefix(data.LastSync.String(), "0") {
			err := utils.SyncTimetable(config, data.AccessToken, data.RefreshToken, data.Expiry, data.Email, data.CourseCode)
			if (err != nil) {
				response.Success = false
				response.Message = "Settings were saved, but failed to sync timetable."
			}
		}


		response.Success = true
		response.Message = "Saved to database"
		return c.JSON(http.StatusOK, response)
	})

	e.POST("/sync", func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
		}

		var data models.User

		err := json.NewDecoder(c.Request().Body).Decode(&data)
		if err != nil {
			response.Success = false
			response.Message = "Error decoding request."
			return c.JSON(http.StatusBadRequest, response)
		}

		if auth != data.AccessToken {
			response.Success = false
			response.Message = "Unauthorized."
			return c.JSON(http.StatusUnauthorized, response)
		}

		gUser, gErr := utils.GetGoogleUser(auth)
		if gErr != nil {
			fmt.Println(gErr)
			response.Success = false
			response.Message = "Google Error. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}
		// fmt.Println(gErr)
		// fmt.Println(gUser)
		// fmt.Println(data.Email)
		if gUser.Email != data.Email {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

		syncErr := SyncTimetable(config, data.AccessToken, data.RefreshToken, data.Expiry, data.Email, data.CourseCode)
		if (syncErr != nil) {
			response.Success = false
			response.Message = "Failed to Sync. Error: " + syncErr.Error()
		}

		response.Success = true
		response.Message = "Synced your Timetable"
		return c.JSON(http.StatusOK, response)
	})

	e.Logger.Fatal(e.Start(":1323"))

	// token := getToken(config)
	// client := config.Client(context.Background(), token)

	// srv, err := calendar.New(client)
	// if err != nil {
	// 	log.Fatalf("Unable to create Calendar API service: %v", err)
	// }
	// timetable := getTimetable("COMSCI1")

	// calendarID := "primary"
	// clearTimetable(srv, calendarID)

	// var colors []EventColor
	// currentColorId := 0

	// for _, event := range timetable {
	// 	description := "Staff: " + event.Staff + " - Description: " + event.Description
	// 	color := ""
	// 	exists := false

	// 	for _, eventColor := range colors {
	// 		if eventColor.ModuleName == strings.Split(event.Name, "[")[0] {
	// 			color = eventColor.ColorId
	// 			exists = true
	// 			break
	// 		}
	// 	}

	// 	if !exists {
	// 		if currentColorId == 12 {
	// 			currentColorId = 1
	// 		} else {
	// 			currentColorId += 1
	// 		}
	// 		color = strconv.FormatInt(int64(currentColorId), 10)
	// 		newColor := EventColor{
	// 			ModuleName: strings.Split(event.Name, "[")[0] ,
	// 			ColorId: color,
	// 		}
	// 		colors = append(colors, newColor)
	// 	}

	// 	newEvent := &calendar.Event{
	// 		Summary:     event.Name,
	// 		Description: description,
	// 		Location:    event.Location,
	// 		ColorId: color,

	// 		Start: &calendar.EventDateTime{
	// 			DateTime: event.StartDateTime.Format(time.RFC3339),
	// 			TimeZone: "UTC",
	// 		},
	// 		End: &calendar.EventDateTime{
	// 			DateTime: event.EndDateTime.Format(time.RFC3339),
	// 			TimeZone: "UTC",
	// 		},

	// 		Source: &calendar.EventSource{
	// 			Title: "DCU (Timetable Sync)",
	// 			Url: "https://ts.jamesz.dev",
	// 		},
	// 	}

	// 	inputtedEvent, err := srv.Events.Insert(calendarID, newEvent).Do()
	// 	if err != nil {
	// 		fmt.Printf("Unable to create event: %v", err)
	// 	}

	// 	// Print the event ID if successfully inserted
	// 	fmt.Printf("Event created: %s\n", inputtedEvent.Id)
	// }
}
