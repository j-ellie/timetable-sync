package utils

import (
	"TimetableSync/models"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

func SendMail(subject string, toName string, toAddress string, plainContent string, htmlContent string) (bool, error) {
	from := mail.NewEmail("Timetable Sync", "ts@m.jamesz.dev")
	to := mail.NewEmail(toName, toAddress)
	message := mail.NewSingleEmail(from, subject, to, plainContent, htmlContent)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	response, err := client.Send(message)
	if err != nil {
        fmt.Println(err)
		return false, err
    } else {
        fmt.Println(response.StatusCode)
        fmt.Println(response.Headers)
		return true, nil
    }
}

func SendWelcome(data models.User) error {
	htmlContent, err := os.ReadFile("../emails/welcome.html")
	if err != nil {
		return err
	}
	var emailNotifications string
	if data.EmailNotifications {
		emailNotifications = "Yes"
	} else {
		emailNotifications = "No"
	}

	var formattedString string
	strContent := string(htmlContent)
	formattedString = strings.Replace(strContent, "%NAME%", data.FirstName, 1)
	formattedString = strings.Replace(formattedString, "%COURSE_CODE%", data.CourseCode, 1)
	formattedString = strings.Replace(formattedString, "%FREQUENCY%", data.SyncTime, 1)
	formattedString = strings.Replace(formattedString, "%EMAILNOTI%", emailNotifications, 1)


	success, err2 := SendMail("Welcome to Timetable Sync", data.FirstName, data.Email, " ", string(formattedString))
	fmt.Println(success)
	fmt.Println(err2)
	return nil
}

func SendUpdate(data models.User, timetableStruct []Timetable) error {
	htmlContent, err := os.ReadFile("emails/update.html")
	if err != nil {
		return err
	}

	var timetableString string

	for _, t := range timetableStruct {
		if isToday(t.StartDateTime) {
			addition := fmt.Sprintf("• %s - %s - %02d:%02d -> %02d:%02d", t.Name, t.Location, t.StartDateTime.Hour(), t.StartDateTime.Minute(), t.EndDateTime.Hour(), t.EndDateTime.Minute())
			timetableString = timetableString + addition + "\n"
		}
	}

	if timetableString == "" {
		return nil
	}

	var formattedString string
	strContent := string(htmlContent)
	formattedString = strings.Replace(strContent, "%NAME%", data.FirstName, 1)
	formattedString = strings.Replace(formattedString, "%COURSE_CODE%", data.CourseCode, 1)

	formattedString = strings.Replace(formattedString, "%TIMETABLE%", timetableString, 1)

	currentTime := time.Now()
	date := fmt.Sprintf("%02d/%02d/%d", currentTime.Day(), currentTime.Month(), currentTime.Year())
	success, err2 := SendMail("Your timetable for " + date, data.FirstName, data.Email, " ", string(formattedString))
	fmt.Println(success)
	fmt.Println(err2)

	return nil
}

func SendUpdateError(data models.User, problem string) error {
	htmlContent, err := os.ReadFile("emails/updateFailed.html")
	if err != nil {
		return err
	}

	var formattedString string
	strContent := string(htmlContent)
	formattedString = strings.Replace(strContent, "%NAME%", data.FirstName, 1)
	formattedString = strings.Replace(formattedString, "%ERROR%", problem, 1)

	success, err2 := SendMail("Your timetable failed to sync.", data.FirstName, data.Email, " ", string(formattedString))
	fmt.Println(success)
	fmt.Println(err2)

	return nil
}

func isToday(t time.Time) bool {
	currentTime := time.Now()
	if t.Day() == currentTime.Day() && t.Month() == currentTime.Month() && t.Year() == currentTime.Year() {
		return true
	} else {
		return false
	}
}

// Sends report to TS admins
func SendUpdateReport(startTime time.Time, syncInfo string, report string) error {
	htmlContent, err := os.ReadFile("emails/globalUpdateReport.html")
	if err != nil {
		return err
	}

	currentTime := time.Now()
	duration := currentTime.Sub(startTime)
	hours := int(duration.Hours())
	mins := int(duration.Minutes()) % 60
	secs := int(duration.Seconds()) % 60
	formatTime := fmt.Sprintf("Took %02dh, %02dm, %02ds", hours, mins, secs)

	var formattedString string
	strContent := string(htmlContent)
	formattedString = strings.Replace(strContent, "%STARTTIME%", startTime.Format(time.RFC850), 1)
	formattedString = strings.Replace(formattedString, "%ENDTIME%", time.Now().Format(time.RFC850), 1)
	formattedString = strings.Replace(formattedString, "%TOTALTIME%", formatTime, 1)
	formattedString = strings.Replace(formattedString, "%USER_SYNC%", syncInfo, 1)
	formattedString = strings.Replace(formattedString, "%REPORT%", report, 1)

	date := fmt.Sprintf("%02d/%02d/%d", currentTime.Day(), currentTime.Month(), currentTime.Year())
	success, err2 := SendMail("Global sync report for " + date, "tsadmin", "james@jamesz.dev", " ", string(formattedString))
	fmt.Println(success)
	fmt.Println(err2)

	return nil
}