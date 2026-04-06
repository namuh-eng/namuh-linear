<!-- Source: https://linear.app/developers/oauth-2-0-authentication -->

# OAuth 2.0 authentication

Linear supports OAuth2 authentication, which is recommended if you’re building applications to integrate with Linear.

> [!NOTE]
> It is **highly recommended** you create a workspace for the purpose of managing the OAuth2 Application, as each admin user will have access.

> [!NOTE]
> All OAuth2 applications were migrated to the new refresh token system on April 1, 2026.

## Create an OAuth2 application

Create a new [OAuth2 Application](https://linear.app/settings/api/applications/new) and configure the redirect callback URLs to your application.

## Redirect user access requests to Linear

When authorizing a user to the Linear API, redirect to an authorization URL with correct parameters and scopes:

```http
GET https://linear.app/oauth/authorize HTTP/1.1
```

Name | Description
--- | ---
`client_id` | (required) Client ID provided when you create the OAuth2 Application
`redirect_uri` | (required) Redirect URI
`response_type=code` | (required) Expected response type
`scope` | (required) Comma separated list of scopes:

* `read` - (Default) Read access for the user's account. This scope will always be present.
* `write` - Write access for the user's account. If your application only needs to create comments, use a more targeted scope
* `issues:create` - Allows creating new issues and their attachments
* `comments:create` - Allows creating new issue comments
* `timeSchedule:write` - Allows creating and modifying time schedules
* `admin` - Full access to admin level endpoints. You should never ask for this permission unless it's absolutely needed

See [App authentication](https://linear.app/developers/agents?noRedirect=1#actor-and-scopes) for agent-specific scopes such as  `app:assignable` or `app:mentionable`.
`state` | (optional, **recommended**) Prevents CSRF attacks and should always be supplied. Read more about it [here](https://auth0.com/docs/protocols/state-parameters).
`prompt=consent` | (optional) The consent screen is displayed every time, even if all scopes were previously granted. This can be useful if you want to give users the opportunity to connect multiple workspaces.
`actor` | Define how the OAuth application should create issues, comments and other changes:

* `user` - (Default) Resources are created as the user who authorized the application. This option should be used if you want each user to do their own authentication
* `app` - Resources are created as the application. This option should be used for agents and service accounts or agents.

### PKCE

Linear supports the [PKCE flow](https://www.oauth.com/oauth2-servers/pkce/authorization-request/). To use this flow, you'll need to include two additional parameters as part of your `/authorize` request:

**Name** | Description
--- | ---
`code_challenge` | (required) Code challenge you generated
`code_challenge_method` | (required) Either `plain` or `S256`, depending on whether the challenge is the plain verifier string or the SHA256 hash of the string

### Example

```http
GET https://linear.app/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URL&state=SECURE_RANDOM&scope=read HTTP/1.1

GET https://linear.app/oauth/authorize?client_id=client1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&response_type=code&scope=read,write HTTP/1.1

GET https://linear.app/oauth/authorize?client_id=client1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&response_type=code&scope=read,write&code_challenge=challenge&code_challenge_method=S256 HTTP/1.1
```

## Handle the redirect URLs you specified in the OAuth2 Application

Once the user approves your application they will be redirected back to your application, with the OAuth authorization `code` in the URL params.

Any `state` parameter you specified in step 2 will also be returned in the URL params and must match the value specified in step 2. If the values do not match, the request should not be trusted.

### Example

```http
GET https://example.com/oauth/callback?code=9a5190f637d8b1ad0ca92ab3ec4c0d033ad6c862&state=b1ad0ca92 HTTP/1.1
```

## Exchange ,`code`, for an access token

After receiving the `code`, you can exchange it for a Linear API access token:

```http
POST https://api.linear.app/oauth/token HTTP/1.1
```

> [!NOTE]
> Pass parameters in body as [URL-encoded form submission](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST#url-encoded_form_submission), where the `Content-Type` header must be `application/x-www-form-urlencoded`.

Parameter | Description
--- | ---
`code` | (required) Authorization code from the previous step
`redirect_uri` | (required) Same redirect URI which you used in the previous step
`client_id` | (required) Application's client ID
`client_secret` | (required) Application's client secret
`grant_type=authorization_code` | (required)

### PKCE

If you are using the PKCE flow, the parameters required by the `/token` endpoint are different:

**Name** | **Description**
--- | ---
`code` | (required) Authorization code from the previous step
`redirect_uri` | (required) Same redirect URI which you used in the previous step
`client_id` | (required) Application's client ID
`client_secret` | (optional) Application's client secret
`code_verifier` | (required) The code verifier for the PKCE request that you originally generated before the authorization request
`grant_type=authorization_code` | (required)

### Response

After a successful request, a valid access token and refresh token will be returned in the response. The access token is valid for 24 hours and will need to be refreshed when it expires. Example response:

```json
{  
  "access_token": "00a21d8b0c4e2375114e49c067dfb81eb0d2076f48354714cd5df984d87b67cc",
  "token_type": "Bearer",  
  "expires_in": 86399,  
  "scope": "read write",
  "refresh_token": "sz0c8ffy95zj2ff6bh1hiausauw3dbfsu4gly1z4p49b5odqv8l7owunb654vg1f",
}
```

> [!NOTE]
> Note: OAuth apps created prior to Dec 1, 2023 will instead return `scope` as an array of strings in the token response.

## Refresh an access token

You'll need to use the refresh token you receive alongside your access token to retrieve a new access token when the previous one expires.

For authorization, you have two options:

1. Use HTTP basic authentication by passing a Base64-encoded `client_id:client_secret` string as an authorization header: `Authorization: Basic <base64(client_id:client_secret)>`
2. Pass `client_id` and `client_secret` as parameters

If your access token was generated using PKCE, you can simply pass `client_id` as a parameter.

Requests to consume a refresh token and obtain a new one have a 30-minute grace period to allow for network errors. If you make a request with a valid refresh token but do not receive the new one in the response, you can replay the original request to retrieve the new refresh token up to 30 minutes after the original request.

```http
POST https://api.linear.app/oauth/token HTTP/1.1
```

> [!NOTE]
> Pass parameters in body as [URL-encoded form submission](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST#url-encoded_form_submission), where the `Content-Type` header must be `application/x-www-form-urlencoded`.

**Parameter** | **Description**
--- | ---
`refresh_token` | (required) Refresh token from the previous step
`grant_type=refresh_token` | (required)
`client_id` | (optional if you're using HTTP basic authentication) Application's client ID
`client_secret` | (optional if you're using HTTP basic authentication or refreshing a token generated using PKCE) Application's client secret

### Response

After a successful request, a new valid access token and a new refresh token will be returned in the response:

```json
{  
  "access_token": "fxra4u0msw3bagb9rdn2i641bs52m9zo8ksoxljouygcu31nh8s2jf8fygbepy16",
  "token_type": "Bearer",  
  "expires_in": 86399,  
  "scope": "read write",
  "refresh_token": "qjmj51q8f8fnwe188702jarfqxwhdy6r5ivqy4yjuhw2crubm5e7nyu84un3marx",
}
```

## Make an API request

Once you have obtained a valid access token, you can make a request to Linear's GraphQL API. You can initialize the [Linear Client](https://linear.app/developers/sdk) with the access token:

```typescript
const client = new LinearClient({ accessToken: response.access_token })
const me = await client.viewer
```

Or pass the token as an authorization header: `Authorization: Bearer <ACCESS_TOKEN>`

```sh
curl https://api.linear.app/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  --data '{ "query": "{ viewer { id name } }" }' \
```

## Revoke an access token

To revoke a user’s access, call the revocation endpoint and include the token to be revoked in the `token` form field of the request body.

If available, include `token_type_hint` (`access_token` or `refresh_token`) to help the server identify the token.

```http
POST https://api.linear.app/oauth/revoke HTTP/1.1
```

> [!NOTE]
> Note: For backwards compatibility, we still accept revocation via the `Authorization` header or the legacy `access_token` / `refresh_token` form fields. New integrations should use the `token` field. The `token` field must not be combined with legacy fields.

### Response

Expected HTTP status:

* `200` - token was revoked
* `400` - unable to revoke token (e.g. token was already revoked)
* `401` - unable to authenticate with the token

## Migrate to using refresh tokens

To ease the transition to refresh tokens for OAuth2 applications that weren’t always using them, we've added a temporary endpoint to migrate any old, long-lived access token to a new, short-lived access token with a refresh token.

```http
POST https://api.linear.app/oauth/migrate_old_token HTTP/1.1
```

> [!NOTE]
> Pass parameters in body as [URL-encoded form submission](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST#url-encoded_form_submission), where the `Content-Type` header must be `application/x-www-form-urlencoded`.

**Parameter** | **Description**
--- | ---
`access_token` | (required) Existing long-lived access token
`client_id` | (required) Application's client ID
`client_secret` | (required) Application's client secret

## Client credentials tokens

We support the `client_credentials` grant type for OAuth2 apps that use tokens for server-to-server communication and cannot support a user-initiated OAuth flow involving refresh tokens.

> [!NOTE]
> **Client credentials**
> You must first toggle on client credentials tokens for your OAuth2 app when creating or editing the app in Linear

The token generated using this grant type will be an `app` actor token that has access to all public teams in the workspace and is valid for 30 days. You can learn more about `app` actor tokens [here](https://linear.app/developers/oauth-actor-authorization).

The app user's team access can be modified through the [app details page](https://linear.app/settings/applications/) for your app at any point after the token is generated. Since there is no refresh token paired with this access token, your server is expected to fetch a new token if it receives a 401 error when making a request with the previous token.

Every OAuth2 app can only have one active client credentials token at a time since it is an `app` token. If you request a new client credentials token while you still have an active one, we will invalidate the currently active token and return a new token with a 30-day validity. 

For increased security, we will also invalidate your app's client credentials token if its client secret is rotated. 

### Request

For authorization, you have two options:

1. Use HTTP basic authentication by passing a Base64-encoded `client_id:client_secret` string as an authorization header: `Authorization: Basic <base64(client_id:client_secret)>`
2. Pass `client_id` and `client_secret` as parameters

```http
POST https://api.linear.app/oauth/token HTTP/1.1
```

Name | Description
--- | ---
`grant_type=client_credentials` | (required)
`scope` | (required) Comma-separated list of scopes
`client_id` | (optional if you're using HTTP basic authentication) Application's client ID
`client_secret` | (optional if you're using HTTP basic authentication) Application's client secret

### Response

After a successful request, a new valid access token will be returned in the response:

```json
{  
  "access_token": "fxra4u0msw3bagb9rdn2i621bs52m9zo8ksoxljouygcu31nh8s2jf8fygbepy16",
  "token_type": "Bearer",  
  "expires_in": 2591999,  
  "scope": "read write",
}
```

If your OAuth2 app does not have client credentials tokens enabled, you will receive an error response:

```json
{
  "error":"Error",
  "error_description":"Client does not support the client_credentials grant type"
}                                              
```
