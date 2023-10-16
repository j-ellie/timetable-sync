package utils

import (
	"TimetableSync/models"
	"context"
	"fmt"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
)

type SyncUpdate struct {
	ID primitive.ObjectID
	Success bool
	CourseCode string
	ErrReason string
}

func RunUpdate() error {
	startTime := time.Now()

	if startTime.Weekday().String() == "Saturday" || startTime.Weekday().String() == "Sunday" {
		return nil
	}

	if os.Getenv("RUN_AUTO") != "true" {
		return nil
	} 

	fails := 0

	// get all documents from the db where sync_time == daily
	config := oauth2.Config{
        ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
        RedirectURL:  "postmessage",
        Scopes:       []string{calendar.CalendarEventsScope, calendar.CalendarScope},
        Endpoint:     google.Endpoint,
    }

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userCollection := GetCollections(DB, "users")
	cursor, err := userCollection.Find(ctx, bson.M{"sync_time": "daily"})
	if err != nil {
		fmt.Println("Failed to find all documents:", err)
		return err
	}

	var usersToUpdate []models.User

	var syncs []SyncUpdate

	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		var result models.User
		err := cursor.Decode(&result)
		if err != nil {
			fmt.Println("Failed to decode document: ", err)
		}

		usersToUpdate = append(usersToUpdate, result)
	}

	for _, user := range usersToUpdate {
		err := SyncTimetable(config, user.AccessToken, user.RefreshToken, user.Expiry, user.Email, user.CourseCode, user.EmailNotifications)
		var newFail SyncUpdate
		if err != nil {
			newFail = SyncUpdate {
				ID: user.ID,
				Success: false,
				CourseCode: user.CourseCode,
				ErrReason: err.Error(),
			}
			fails += 1
			SendUpdateError(user, "Failed to sync your timetable, Occurred Error: " + err.Error())
		} else {
			newFail = SyncUpdate {
				ID: user.ID,
				Success: true,
				CourseCode: user.CourseCode,
			}
		}
		syncs = append(syncs, newFail)
	}

	synced := fmt.Sprintf("Synced %v/%v users successfully.", len(usersToUpdate) - fails, len(usersToUpdate))

	var report string
	
	for _, s := range syncs {
		var isSuccess string
		if s.Success {
			isSuccess = "SUCCESS"
		} else {
			isSuccess = "FAILURE"
		}

		addition := fmt.Sprintf("• %s - ID: %s (%s) - Course: %s - Error Reason (?): %s", isSuccess, s.ID, s.CourseCode, s.ErrReason)
		report = report + addition + "\n"
	}

	SendUpdateReport(startTime, synced, report)


	// run SyncTimetable() on this user //
	// email this user if email_notif is true //
	// move on to next user# //

	// if error move on and log to report (maybe email user on error)

	// at the end send a completion report to admins
	return nil
}