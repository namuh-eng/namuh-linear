package notifications

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/namuh-eng/exponential/apps/api/internal/auth"
	"github.com/namuh-eng/exponential/apps/api/internal/problem"
)

type Handler struct{ DB *pgxpool.Pool }

type Notification struct {
	ID              string  `json:"id"`
	Type            string  `json:"type"`
	ActorName       string  `json:"actorName"`
	ActorImage      *string `json:"actorImage"`
	IssueIdentifier string  `json:"issueIdentifier"`
	IssueTitle      string  `json:"issueTitle"`
	IssuePriority   string  `json:"issuePriority"`
	IssueID         *string `json:"issueId"`
	ReadAt          *string `json:"readAt"`
	SnoozedUntilAt  *string `json:"snoozedUntilAt"`
	UnsnoozedAt     *string `json:"unsnoozedAt"`
	CreatedAt       string  `json:"createdAt"`
}

type listResponse struct {
	Notifications []Notification `json:"notifications"`
	UnreadCount   int32          `json:"unreadCount"`
}

type bulkReadResponse struct {
	Success      bool  `json:"success"`
	UpdatedCount int64 `json:"updatedCount"`
	UnreadCount  int32 `json:"unreadCount"`
}

func (h Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Patch("/bulk-read", h.BulkRead)
	return r
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	p, _ := auth.FromContext(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		select n.id::text, n.type::text, coalesce(a.name,'Unknown'), a.image, i.id::text, coalesce(i.identifier,''), coalesce(i.title,''), coalesce(i.priority::text,'none'), n.read_at, n.snoozed_until_at, n.unsnoozed_at, n.created_at
		from notification n
		left join "user" a on a.id=n.actor_id
		left join issue i on i.id=n.issue_id
		where n.user_id=$1
		order by n.created_at desc
		limit 100`, p.UserID)
	if err != nil {
		problem.Write(w, 500, "List notifications failed", err.Error())
		return
	}
	defer rows.Close()
	items := []Notification{}
	for rows.Next() {
		item, err := scanNotification(rows)
		if err != nil {
			problem.Write(w, 500, "List notifications failed", err.Error())
			return
		}
		items = append(items, item)
	}
	count, err := h.unreadCount(r.Context(), p.UserID)
	if err != nil {
		problem.Write(w, 500, "List notifications failed", err.Error())
		return
	}
	problem.JSON(w, 200, listResponse{Notifications: items, UnreadCount: count})
}

func (h Handler) BulkRead(w http.ResponseWriter, r *http.Request) {
	p, _ := auth.FromContext(r.Context())
	cmd, err := h.DB.Exec(r.Context(), `update notification set read_at=now() where user_id=$1 and read_at is null and type <> 'comment'`, p.UserID)
	if err != nil {
		problem.Write(w, 500, "Mark notifications read failed", err.Error())
		return
	}
	count, err := h.unreadCount(r.Context(), p.UserID)
	if err != nil {
		problem.Write(w, 500, "Mark notifications read failed", err.Error())
		return
	}
	problem.JSON(w, 200, bulkReadResponse{Success: true, UpdatedCount: cmd.RowsAffected(), UnreadCount: count})
}

type scanner interface{ Scan(dest ...any) error }

func scanNotification(row scanner) (Notification, error) {
	var n Notification
	var readAt, snoozed, unsnoozed *time.Time
	var created time.Time
	if err := row.Scan(&n.ID, &n.Type, &n.ActorName, &n.ActorImage, &n.IssueID, &n.IssueIdentifier, &n.IssueTitle, &n.IssuePriority, &readAt, &snoozed, &unsnoozed, &created); err != nil {
		return Notification{}, err
	}
	n.ReadAt = formatTime(readAt)
	n.SnoozedUntilAt = formatTime(snoozed)
	n.UnsnoozedAt = formatTime(unsnoozed)
	n.CreatedAt = created.UTC().Format(time.RFC3339Nano)
	return n, nil
}

func (h Handler) unreadCount(ctx context.Context, userID string) (int32, error) {
	var count int32
	err := h.DB.QueryRow(ctx, `select count(*)::int from notification where user_id=$1 and read_at is null and (snoozed_until_at is null or snoozed_until_at <= now() or (unsnoozed_at is not null and unsnoozed_at >= snoozed_until_at))`, userID).Scan(&count)
	return count, err
}

func formatTime(t *time.Time) *string {
	if t == nil {
		return nil
	}
	v := t.UTC().Format(time.RFC3339Nano)
	return &v
}
