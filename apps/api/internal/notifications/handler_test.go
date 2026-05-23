package notifications

import (
	"testing"
	"time"
)

func TestFormatTime(t *testing.T) {
	if formatTime(nil) != nil {
		t.Fatal("nil time should stay nil")
	}
	now := time.Date(2026, 5, 24, 1, 2, 3, 0, time.UTC)
	got := formatTime(&now)
	if got == nil || *got != "2026-05-24T01:02:03Z" {
		t.Fatalf("time = %#v", got)
	}
}
