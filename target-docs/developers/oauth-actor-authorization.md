<!-- Source: https://linear.app/developers/oauth-actor-authorization -->

# OAuth actor authorization

By default all Linear’s API authentication methods treat the authenticating user as the API actor. This means that actions performed with the OAuth token will appear to come from that user, this is usually what you want!

Linear also supports an alternative authentication method with **OAuth Actor Authorization** – when authenticating this way the user will instead authorize installing the app within the workspace, actions performed with the received OAuth token will come from the app itself. This is particularly useful for agents and service accounts.

To enable the actor authorization, add `actor=app` parameter to your [OAuth authorization URL](https://linear.app/developers/oauth-2-0-authentication#redirect-user-access-requests-to-linear). The setting is tied to the authorization and its access token. In this mode, all mutations such as creating issues, comments, and status changes will be performed by the app.

You can also add an optional user name and avatar to go with the application to have it rendered in _User (via Application)_ format. This will help identify the user that performed the action in the 3rd party system that do not have a Linear account.

To set the custom user name, set the `createAsUser` attribute with the user name and set `displayIconUrl` with the URL of the avatar in `issueCreate` or `commentCreate` mutations:

```graphql
mutation IssueCreate {
  issueCreate(
    input: {
      title: "New exception"
      description: "More detailed error report in markdown"
      teamId: "9cfb482a-81e3-4154-b5b9-2c805e70a02d"
      createAsUser: "Mark"
      displayIconUrl: "http://path.to/image.png"
    }
  ) {
    success
    issue {
      id
      title
    }
  }
}
```



> [!NOTE]
> Note, we previously supported a similar `actor=application` as a mode – this was deprecated in favor of the behavior in `actor=app`. If your app already uses this option then you can continue to do so.
