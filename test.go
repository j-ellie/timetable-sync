package main
import (
	"fmt"	
	"time"
)
// 2023-10-02

func main() {
	currentTime := time.Now()
	twoWeeks := currentTime.AddDate(0,0,14)
	// timeTwoWeeks := currentTime.Add(twoWeeks)
	timeFormat := "2006-01-02"

	fmt.Println(currentTime)
	fmt.Println(twoWeeks)
	fmt.Println(currentTime.Format(timeFormat))
	fmt.Println(twoWeeks.Format(timeFormat))
}
