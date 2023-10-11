package main

import (
	"fmt"
	"io/ioutil"
	"log"
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
        // fmt.Println(response.Headers)
		return true, nil
    }
}

func main() {
	htmlContent, err := ioutil.ReadFile("emails/update.html")
	if err != nil {
		log.Fatal(err)
	}

	timetable := "• CA116[1]OC/P2/01 - GLA.L101, GLA.L128, GLA.LG25, GLA.LG26 - 14:00 -> 16:00" + "\n" + "• CA103[1]OC/P2/01 - HG20 - 14:00 -> 16:00" + "\n"

	var formattedString string
	strContent := string(htmlContent)
	formattedString = strings.Replace(strContent, "%NAME%", "James", 1)
	formattedString = strings.Replace(formattedString, "%COURSE_CODE%", "COMSCI1", 1)
	formattedString = strings.Replace(formattedString, "%TIMETABLE%", timetable, 1)


	success, err2 := SendMail("Your Timetable for 10/10/23", "james", "james@jamesz.dev", "content", string(formattedString))
	fmt.Println(success)
	fmt.Println(err2)
}	