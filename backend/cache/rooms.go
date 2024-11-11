package cache

import (
    "encoding/json"
    "os"
    "sync"
)

type StoredRoom struct {
	FriendlyName 			string `json:"friendly_name"`
	ID 						string `json:"id"`
	CategoryTypeIdentity 	string `json:"category_type_identity"`
	Identity 				string `json:"identity"`
}

var (
    roomsCache    []StoredRoom
    roomsCacheMux sync.RWMutex
)

// LoadRooms loads the rooms from file into the global cache.
// It should be called only once, on application startup.
func LoadRooms() error {
    file, err := os.Open("lists/rooms.json")
    if err != nil {
        return err
    }
    defer file.Close()

    var rooms []StoredRoom
    decoder := json.NewDecoder(file)
    if err := decoder.Decode(&rooms); err != nil {
        return err
    }

    roomsCacheMux.Lock()
    roomsCache = rooms
    roomsCacheMux.Unlock()
    return nil
}

// GetRooms provides read-only access to the cached rooms data.
func GetRooms() []StoredRoom {
    roomsCacheMux.RLock()
    defer roomsCacheMux.RUnlock()
    return roomsCache
}
