package utils

import (
	"context"
	"log"
	"time"
	"fmt"
	"os"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/joho/godotenv"
)


func Connect() *mongo.Client {
	fmt.Println("Connecting to the database...")

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file.")
	}

	mongoURI := os.Getenv("MONGO_URI")
	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
 
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("The Database is ready to go! :)")
	return client

}

var DB *mongo.Client = Connect()

// Getting database connections
func GetCollections(client *mongo.Client, collectionName string) *mongo.Collection {
	collection := client.Database("timetable-sync").Collection(collectionName)
	return collection
}
