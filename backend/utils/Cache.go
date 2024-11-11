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
	RoomID string `json:"room_id"`
	CachedAt time.Time `json:"cached_at"`
	From time.Time `json:"from"`
	To time.Time `json:"to"`
	Events []RawEvent `json:"events"`
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
        Password: redisPassw, // no password set
        DB:       0,  // use default DB
    })

	_, err := rdb.Ping(ctx).Result()
    if err != nil {
        fmt.Println("Could not connect to Redis:", err)
        return nil
    }
    fmt.Println("Connected to Redis!")
	return rdb

    // err := rdb.Set(ctx, "key", "value", 0).Err()
    // if err != nil {
    //     panic(err)
    // }

    // val, err := rdb.Get(ctx, "key").Result()
    // if err != nil {
    //     panic(err)
    // }
    // fmt.Println("key", val)

    // val2, err := rdb.Get(ctx, "key2").Result()
    // if err == redis.Nil {
    //     fmt.Println("key2 does not exist")
    // } else if err != nil {
    //     panic(err)
    // } else {
    //     fmt.Println("key2", val2)
    // }
}

var Cache *redis.Client = ConnectCache()

func CheckCache(roomId string, targetTime time.Time) ([]RawEvent, error) {
	cached, err := Cache.Get(ctx, roomId).Result()
    if err == redis.Nil {
        fmt.Println("[Cache] >> " + roomId + " not cached.")
		return nil, nil
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

        if targetTime.Before(parsedCache.To) && targetTime.After(parsedCache.From) || targetTime.Equal(parsedCache.From) {
            return parsedCache.Events, nil
        }
        return nil, nil
    }
}

func CacheRooms(roomId string, from time.Time, to time.Time, events []RawEvent) (error) {
    toCache := CachedRoom{
        RoomID: roomId,
        CachedAt: time.Now(),
        From: from,
        To: to,
        Events: events,
    }

    formatted, jsonErr := json.Marshal(toCache)
    if jsonErr != nil {
        return jsonErr
    }
    
    err := Cache.Set(ctx, roomId, formatted, 0).Err()
    if err != nil {
        return err
    }

    return nil
}