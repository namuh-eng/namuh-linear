# Linear Authentication Flow

## Auth Methods (for the clone)

### 1. Google OAuth (Primary)
- Users click "Continue with Google" on login/signup page
- Standard OAuth2 flow with Google
- Auto-creates account on first login
- Already configured in ralph-config.json via Better Auth

### 2. Email Magic Links (Passwordless)
- User enters email, clicks "Continue with Email"
- Linear sends a magic link email from notifications@linear.app
- Email contains both a clickable link AND a 6-digit code
- User can click the link or manually enter the code
- No password is ever set — purely passwordless

### 3. Passkeys (Optional)
- Users can register passkey devices from Preferences > Account > Security & Access
- Supported by browsers, mobile OS, and password managers
- Multiple devices can be registered
- Out of scope for initial clone build

### 4. SAML SSO (Enterprise)
- Enterprise-only feature
- Out of scope for clone (no billing tiers)

## Login Page Structure
- Clean, minimal login page
- "Continue with Google" button (prominent)
- "Continue with Email" button
- "Continue with SAML SSO" link (smaller, enterprise)
- "Continue with Passkey" option
- No password fields — Linear is fully passwordless

## Signup Flow
1. User visits /signup or /login (same page effectively)
2. Chooses Google or Email
3. If Google: OAuth redirect → callback → account creation if new
4. If Email: Enter email → receive magic link → click link or enter code
5. After auth, if new user:
   - Prompted to create a workspace OR join existing (if email domain matches)
   - Enter workspace name and URL slug
   - Default team auto-created with workspace name
   - Redirected to main dashboard
6. If existing user: redirected to last-visited workspace

## Session Management
- Sessions are persistent (stay logged in)
- Logging out from one location logs out ALL sessions
- Multiple workspaces accessible from single account
- Workspace switching via sidebar dropdown

## Post-Login Behavior
- Redirect to last-visited workspace
- If no workspace: redirect to workspace creation
- Workspace switcher in top-left corner

## For the Clone (Better Auth)
- **Google OAuth**: Use Better Auth's Google provider
- **Magic Links**: Use Better Auth's email provider + AWS SES for sending
- **Sessions**: Stored in Postgres via Better Auth's Drizzle adapter
- **Protected Routes**: Next.js middleware checking session
- **No passwords**: Match Linear's passwordless approach
