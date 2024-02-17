package main

import (
	"TimetableSync/models"
	"TimetableSync/utils"
	"strings"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"github.com/go-co-op/gocron"
)

func testStream(c echo.Context) error {
    // Set the response header to indicate that the response will be streamed
    c.Response().Header().Set(echo.HeaderContentType, "text/plain")
    c.Response().WriteHeader(http.StatusOK)

    // Some data to stream (example: counting from 1 to 10)
    for i := 1; i <= 10; i++ {
        // Send the data to the client
        _, err := c.Response().Write([]byte(fmt.Sprintf("%d\n", i)))
        if err != nil {
            return err
        }
        c.Response().Flush()
        time.Sleep(time.Second) // Simulate some delay
    }

    return nil
}

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
		return c.String(http.StatusOK, "Timetable Sync API Responsive.")
	})

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://127.0.0.1:5173", "http://localhost:5173", "https://ts.jamesz.dev", "https://ts.elliee.me"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodDelete},
		AllowHeaders: []string{"*", "Authorization"},
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
			"expiry": token.Expiry,
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
			fmt.Println(err)
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

		if gUser.Email != data.Email {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

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
			err := utils.SyncTimetable(config, data.AccessToken, data.RefreshToken, data.Expiry, data.Email, data.CourseCode, false, data.IgnoredEvents)
			err2 := utils.SendWelcome(data)
			if (err2 != nil) {
				fmt.Println(err2)
			}
			if (err != nil) {
				response.Success = false
				response.Message = "Settings were saved, but failed to sync timetable."
				return c.JSON(http.StatusOK, response)
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

		if gUser.Email != data.Email {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

		syncErr := utils.SyncTimetable(config, data.AccessToken, data.RefreshToken, data.Expiry, data.Email, data.CourseCode, true, data.IgnoredEvents)
		if (syncErr != nil) {
			response.Success = false
			response.Message = "Failed to Sync. Error: " + syncErr.Error()
		}

		response.Success = true
		response.Message = "Synced your Timetable"
		return c.JSON(http.StatusOK, response)
	})

	e.GET("/courses", func(c echo.Context) error {
		ids, err := utils.GetAllCodes()

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			Ids     	[]string `json:"ids"omitempty`
		}

		if err != nil {
			response.Success = true
			response.Message = "Failed to get courses. Error: " + err.Error()
			return c.JSON(http.StatusInternalServerError, response)
		}		

		response.Ids = ids
		response.Success = true

		return c.JSON(http.StatusOK, response)
	})

	e.GET("/rooms", func(c echo.Context) error {
		ids, err := utils.GetAllRooms()

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			Ids     	[]string `json:"ids"omitempty`
		}

		if err != nil {
			response.Success = true
			response.Message = "Failed to get rooms. Error: " + err.Error()
			return c.JSON(http.StatusInternalServerError, response)
		}		

		response.Ids = ids
		response.Success = true

		return c.JSON(http.StatusOK, response)
	})

	e.GET("/buildings", func(c echo.Context) error {
		ids, err := utils.GetBuildings()

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			Ids     	[]string `json:"ids"omitempty`
		}

		if err != nil {
			response.Success = true
			response.Message = "Failed to get buildings. Error: " + err.Error()
			return c.JSON(http.StatusInternalServerError, response)
		}		

		response.Ids = ids
		response.Success = true

		return c.JSON(http.StatusOK, response)
	})

	e.DELETE("/delete", func(c echo.Context) error {
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

		if gUser.Email != data.Email {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userCollection := utils.GetCollections(utils.DB, "users")
		dbErr := userCollection.FindOneAndDelete(ctx, bson.M{"email": data.Email, "access_token": data.AccessToken, "google_id": data.GoogleID, "_id": data.ID})
		if (dbErr.Err() != nil) {
			response.Success = false
			response.Message = "Failed to delete. Error: " + dbErr.Err().Error()
		}

		response.Success = true
		response.Message = "Deleted successfully. Sad to see you go :("
		return c.JSON(http.StatusOK, response)
	})

	e.GET("/room", func (c echo.Context) error {
		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			Data utils.Returnable `json:"data"`
		}

		roomNumber := c.Request().URL.Query().Get("room")
		targetTime := c.Request().URL.Query().Get("time")
		if roomNumber == "" || targetTime == "" {
			response.Success = false
			response.Message = "No room number given."
			return c.JSON(http.StatusBadRequest, response)
		}
		roomInfo, _ := utils.GetRoom(roomNumber, targetTime)

		
		response.Success = true
		response.Data = roomInfo

		return c.JSON(http.StatusOK, response)
	})

	e.GET("/building", func (c echo.Context) error {
		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			Data []utils.Returnable `json:"data"`
		}

		building := c.Request().URL.Query().Get("building")
		targetTime := c.Request().URL.Query().Get("time")
		if building == "" || targetTime == "" {
			response.Success = false
			response.Message = "No building given."
			return c.JSON(http.StatusBadRequest, response)
		}
		rooms, _ := utils.GetFreeRoomsInBuilding(building, targetTime)
		
		response.Success = true
		response.Data = rooms

		return c.JSON(http.StatusOK, response)
	})

	e.GET("/stream", testStream)


	scheduler := gocron.NewScheduler(time.Local)
	scheduler.Every(1).Day().WaitForSchedule().At("8:30").Do(utils.RunUpdate)
	scheduler.StartAsync()

	e.Logger.Fatal(e.Start(":1323"))
}