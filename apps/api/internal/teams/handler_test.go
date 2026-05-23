package teams

import "testing"

func TestTeamKeyBase(t *testing.T) {
	if got := teamKeyBase("Linear Clone"); got != "LIN" {
		t.Fatalf("key = %q", got)
	}
	if got := teamKeyBase("123"); got != "WRK" {
		t.Fatalf("numeric key base = %q", got)
	}
}

func TestValidateKey(t *testing.T) {
	if err := validateKey("ENG"); err != nil {
		t.Fatalf("expected valid key: %v", err)
	}
	if err := validateKey("1BAD"); err == nil {
		t.Fatal("expected first-char validation failure")
	}
	if err := validateKey("TOO-LONG"); err == nil {
		t.Fatal("expected character validation failure")
	}
}
