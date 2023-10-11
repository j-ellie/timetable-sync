package utils

import (
	"TimetableSync/models"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

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
	htmlContent, err := ioutil.ReadFile("../emails/welcome.html")
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
}

func SendUpdate(data models.User) error {
	htmlContent, err := ioutil.ReadFile("../emails/update.html")
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
}