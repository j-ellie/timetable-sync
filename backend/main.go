package main

import (
	"TimetableSync/models"
	"TimetableSync/utils"
	"TimetableSync/cache"
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

	if err := cache.LoadRooms(); err != nil {
        panic(fmt.Sprintf("Failed to load rooms data into cache: %v", err))
    }

	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Timetable Sync API Responsive.")
	})

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://127.0.0.1:5173", "http://localhost:5173", "https://ts.jamesz.dev", "https://ts.elliee.me", "https://timetable-sync-orangebeatle123-orangebeatle123s-projects.vercel.app"},
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

	e.GET("/admin", func(c echo.Context) error {
		// Requires Token, Email and userId headers
		// Verify token with database, get email and userid and match with google api
		auth := c.Request().Header.Get("Authorization")
		email := c.Request().Header.Get("userEmail")
		id := c.Request().Header.Get("userId")

		var response struct {
			Success     bool   			`json:"success"`
			Message     string 			`json:"message"omitempty`
			Users       []models.CensoredUser 	`json:"users"omitempty`
			DailySync   bool 			`json:"daily_sync"omitempty`
		}

		gUser, gErr := utils.GetGoogleUser(auth)
		if gErr != nil {
			fmt.Println(gErr)
			response.Success = false
			response.Message = "Google Error. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}


		if gUser.Email == "" || gUser.Email != email || gUser.ID != id {
			response.Success = false
			response.Message = "Access token doesn't match email. Try re-logging in?"
			return c.JSON(http.StatusUnauthorized, response)
		}

		ctx := context.Background()		

		var user models.User
		var userCollection *mongo.Collection = utils.GetCollections(utils.DB, "users")
		dbErr := userCollection.FindOne(ctx, bson.M{"email" : gUser.Email, "access_token" : auth, "google_id": id}).Decode(&user)
		if dbErr != nil {
			fmt.Println(dbErr)
			response.Success = false
			response.Message = "Error occurred."
			return c.JSON(http.StatusUnauthorized, response)
		}

		if user.Email == "" || !user.Admin {
			response.Success = false
			response.Message = "Failed to pass authorization checks."
			return c.JSON(http.StatusUnauthorized, response)
		}

		if user.Email != email || user.GoogleID != id {
			response.Success = false
			response.Message = "Failed to pass authorization checks."
			return c.JSON(http.StatusUnauthorized, response)
		}

		cursor, err := userCollection.Find(ctx, bson.M{})
		if err != nil {
			fmt.Println("Failed to find all documents:", err)
			return err
		}

		var users []models.CensoredUser

		defer cursor.Close(ctx)
		for cursor.Next(ctx) {
			var result models.CensoredUser
			err := cursor.Decode(&result)
			if err != nil {
				fmt.Println("Failed to decode document: ", err)
			}

			users = append(users, result)
		}

		response.Success = true
		response.Message = "Authorized"
		response.Users = users
		response.DailySync = os.Getenv("RUN_AUTO") == "true"

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

	e.GET("/options", func(c echo.Context) error {
		modId, err := utils.GetModules()
		courseId, err2 := utils.GetAllCodes()
		roomId, err3 := utils.GetAllRooms()

		var response struct {
			Success     bool   `json:"success"`
			Message     string `json:"message"omitempty`
			CourseIds     	[]string `json:"course_ids"omitempty`
			ModuleIds     	[]string `json:"module_ids"omitempty`
			RoomIds     	[]string `json:"room_ids"omitempty`
		}

		if err != nil || err2 != nil || err3 != nil {
			response.Success = true
			response.Message = "Failed to get modules and courses. Error: " + err.Error()
			return c.JSON(http.StatusInternalServerError, response)
		}		

		response.CourseIds = courseId
		response.ModuleIds = modId
		response.RoomIds = roomId
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
		roomInfo, grErr := utils.GetRoom(roomNumber, targetTime)
		if grErr != nil {
			fmt.Println("Get Room Error: ", grErr)
		}

		
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

	e.GET("/building/stream", func (c echo.Context) error {
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
		utils.StreamGetFreeRoomsInBuilding(c, building, targetTime)

		return nil
	})

	e.GET("/timetable", func (c echo.Context) error {
		var response struct {
			Success bool `json:"success"`
			Message string `json:"message"`
			Events []utils.Timetable `json:"events"omitempty`
		}

		courseCode := c.Request().URL.Query().Get("course")
		moduleCode := c.Request().URL.Query().Get("module")
		roomCode := c.Request().URL.Query().Get("room")
		from := c.Request().URL.Query().Get("from")
		to := c.Request().URL.Query().Get("to")

		var types int32;

		isModule := courseCode == "" && moduleCode != "" && roomCode == ""
		isRoom := courseCode == "" && moduleCode == "" && roomCode != ""
		if isModule {
			// quick fix here to avoid having to rewrite GetTimetable call
			courseCode = moduleCode
			types = 1
		} else if isRoom{
			courseCode = roomCode
			types = 2
		} else {
			types = 0
		}

		timeFormat := "Mon, 02 Jan 2006 15:04:05 GMT"

		fromTime, tErr1 := time.Parse(timeFormat, from)
		toTime, tErr2 := time.Parse(timeFormat, to)

		if tErr1 != nil || tErr2 != nil {
			response.Success = false
			response.Message = "Error parsing time."
			return c.JSON(http.StatusInternalServerError, response)
		}

		timetable := utils.GetTimetable(courseCode, types, nil, false, fromTime, toTime)
		response.Events = timetable

		response.Success = true
		response.Message = fmt.Sprintf("Fetched %d events", len(timetable))
		return c.JSON(http.StatusOK, response)
	})

	// e.GET("/announcement", func (c echo.Context) error {
	// 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	// 	defer cancel()
	// 	userCollection := utils.GetCollections(utils.DB, "users")
	// 	cursor, err := userCollection.Find(ctx, bson.M{})
	// 	if err != nil {
	// 		fmt.Println("Failed to find all documents:", err)
	// 		return err
	// 	}

	// 	var usersToUpdate []models.User

	// 	defer cursor.Close(ctx)
	// 	for cursor.Next(ctx) {
	// 		var result models.User
	// 		err := cursor.Decode(&result)
	// 		if err != nil {
	// 			fmt.Println("Failed to decode document: ", err)
	// 		}

	// 		fmt.Println("emailing: ", result.Email)

	// 		err2 := utils.SendWelcomeBack(result)
	// 		if err2 != nil {
	// 			fmt.Println("Error while emailing: ", err)
	// 		}

	// 		usersToUpdate = append(usersToUpdate, result)
	// 	}
	// 	fmt.Println("sent emails: ", len(usersToUpdate))
	// 	return nil
	// })

	scheduler := gocron.NewScheduler(time.Local)
	scheduler.Every(1).Day().WaitForSchedule().At("8:30").Do(utils.RunUpdate)
	scheduler.StartAsync()

	e.Logger.Fatal(e.Start(":1323"))
}