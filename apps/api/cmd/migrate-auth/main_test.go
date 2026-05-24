package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestUpsertIdentityEscapesEmailSearchAndCreatesIdentity(t *testing.T) {
	var searchedPath string
	var created map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method + " " + r.URL.Path {
		case "GET /admin/identities":
			searchedPath = r.URL.RawQuery
			_ = json.NewEncoder(w).Encode([]map[string]any{})
		case "POST /admin/identities":
			if err := json.NewDecoder(r.Body).Decode(&created); err != nil {
				t.Fatalf("decode create body: %v", err)
			}
			w.WriteHeader(http.StatusCreated)
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.String())
		}
	}))
	defer server.Close()

	err := upsertIdentity(context.Background(), server.Client(), server.URL, userRow{ID: "user-1", Email: "plus+user@example.com", Name: "Plus User", EmailVerified: true})
	if err != nil {
		t.Fatalf("upsertIdentity: %v", err)
	}
	if !strings.Contains(searchedPath, "credentials_identifier=plus%2Buser%40example.com") {
		t.Fatalf("search query was not escaped: %s", searchedPath)
	}
	traits := created["traits"].(map[string]any)
	if traits["legacy_user_id"] != "user-1" || traits["email_verified"] != true {
		t.Fatalf("traits = %#v", traits)
	}
}

func TestUpsertIdentitySkipsExistingIdentity(t *testing.T) {
	created := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			_ = json.NewEncoder(w).Encode([]map[string]any{{"id": "identity-1"}})
			return
		}
		created = true
	}))
	defer server.Close()

	err := upsertIdentity(context.Background(), server.Client(), server.URL, userRow{Email: "user@example.com"})
	if err != nil {
		t.Fatalf("upsertIdentity: %v", err)
	}
	if created {
		t.Fatal("existing identity should not be recreated")
	}
}
