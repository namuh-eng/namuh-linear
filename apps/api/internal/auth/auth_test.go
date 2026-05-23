package auth

import (
	"net/http/httptest"
	"testing"
)

func TestBearerTokenReadsAuthorization(t *testing.T) {
	req := httptest.NewRequest("GET", "/v1/issues", nil)
	req.Header.Set("Authorization", "Bearer pat_secret")
	if got := bearerToken(req); got != "pat_secret" {
		t.Fatalf("token = %q", got)
	}
}

func TestBearerTokenReadsAccessTokenQuery(t *testing.T) {
	req := httptest.NewRequest("GET", "/v1/sync/ws?access_token=pat_query", nil)
	if got := bearerToken(req); got != "pat_query" {
		t.Fatalf("token = %q", got)
	}
}
