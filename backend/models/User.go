package models
import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type User struct {
	ID primitive.ObjectID `json:"_id" bson:"_id"`
	Email string `json:"email" bson:"email"`
	GoogleID string `json:"google_id" bson:"google_id"`
	FirstName string `json:"name" bson:"name"`
	UserPicture string `json:"user_picture" bson:"user_picture"`
	AccessToken string `json:"access_token" bson:"access_token"`
	RefreshToken string `json:"refresh_token" bson:"refresh_token"`
	Expiry time.Time `json:"expiry" bson:"expiry"`
	LastSync time.Time `json:"last_sync" bson:"last_sync"omitempty`
	CourseCode string `json:"course_code" bson:"course_code"omitempty`
	SyncTime string `json:"sync_time" bson:"sync_time"omitempty`
	EmailNotifications bool `json:"email_notif" bson:"email_notif"omitempty`
}
