package utils

func RunUpdate() error {
	// send start notification admin

	// get all documents from the db where sync_time == daily
	// run SyncTimetable() on this user
	// email this user if email_notif is true
	// move on to next user#

	// if error move on and log to report (maybe email user on error)

	// at the end send a completion report to admins
}