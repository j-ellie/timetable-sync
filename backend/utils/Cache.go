package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

type CachedRoom struct {
	RoomID   string     `json:"room_id"`
	CachedAt time.Time  `json:"cached_at"`
	Date     time.Time  `json:"date"`
	Events   []RawEvent `json:"events"`
}

var ctx = context.Background()

func ConnectCache() *redis.Client {
	_err := godotenv.Load()
	if _err != nil {
		log.Fatal("Error loading .env file.")
	}
	redisAddr := os.Getenv("REDIS_ADDR")
	redisPassw := os.Getenv("REDIS_PASS")
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassw,
		DB:       0, // use default DB
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		fmt.Println("Could not connect to Redis:", err)
		return nil
	}
	fmt.Println("Connected to Redis!")
	return rdb
}

var Cache *redis.Client = ConnectCache()

func CheckCache(roomId string, targetTime time.Time) ([]RawEvent, error) {
	name := fmt.Sprintf("%s:%s", roomId, targetTime.Format("2006-01-02"))
	cached, err := Cache.Get(ctx, name).Result()
	if err == redis.Nil {
		fmt.Println("[Cache] >> " + roomId + " not cached.")
		return nil, fmt.Errorf("No Cache")
	} else if err != nil {
		fmt.Errorf("[Cache] >> ERROR: " + err.Error())
		return nil, err
	} else {
		// fmt.Println("cached", cached)

		var parsedCache CachedRoom
		jsonErr := json.Unmarshal([]byte(cached), &parsedCache)

		if jsonErr != nil {
			return nil, jsonErr
		}

		return parsedCache.Events, nil
		// if targetTime.Before(parsedCache.To) && targetTime.After(parsedCache.From) || targetTime.Equal(parsedCache.From) {
		//     return parsedCache.Events, nil
		// }
		// return nil, nil
	}
}

func CacheRooms(roomId string, date time.Time, events []RawEvent) error {
	toCache := CachedRoom{
		RoomID:   roomId,
		CachedAt: time.Now(),
		Date:     date,
		Events:   events,
	}

	formatted, jsonErr := json.Marshal(toCache)
	if jsonErr != nil {
		return jsonErr
	}

	name := fmt.Sprintf("%s:%s", roomId, date.Format("2006-01-02"))

	expiry := time.Hour * 2

	err := Cache.Set(ctx, name, formatted, expiry).Err()
	if err != nil {
		return err
	}

	return nil
}

func CheckStatus() error {
	if Cache == nil {
		return fmt.Errorf("No redis instance.")
	}

	_, err := Cache.Ping(context.Background()).Result()

	return err
}
