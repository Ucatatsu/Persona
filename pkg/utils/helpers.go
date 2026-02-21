package utils

import (
	"fmt"
	"math/rand"
	"time"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GenerateTag() string {
	return fmt.Sprintf("%04d", 1000+rand.Intn(9000))
}

