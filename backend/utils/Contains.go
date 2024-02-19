package utils

func contains(lst []string, elem string) bool {
	for _, a := range lst {
		if a == elem {
			// fmt.Println("true")
			return true
		}
	}
	return false
}