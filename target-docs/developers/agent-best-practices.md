<!-- Source: https://linear.app/developers/agent-best-practices -->

# Interaction Best Practices

Linear users have high expectations for the quality and consistency of the experience inside Linear. We aim to extend this to agents, which should act in a predictable and natural manner.

## Recommendations

Upon receiving the `created` webhook, your agent should respond immediately with a `thought` activity to acknowledge that the agent has started working. This lets the user know right away that their prompt has been received.  

> [!NOTE]
> The first response must be sent within 10 seconds of receiving the `created` event, or the agent will be shown as unresponsive. 
> 
> Follow-up activities after the first response can still be sent for up to 30 minutes before the session is considered stale. Note that this stale state is recoverable by sending another agent activity.

If your agent is delegated to work on an issue that is not in a `started`, `completed`, or `canceled` status type, move the issue to the first status in `started` when your agent begins work. You can fetch this by querying the team’s workflow states filtered by `type: { eq: "started" }`, and selecting the one with the lowest `position`:

```graphql
query TeamStartedStatuses($teamId: String!) {
  team(id: $teamId) {
    states(filter: { type: { eq: "started" } }) {
      nodes {
        id
        name
        position
      }
    }
  }
}
```

If your agent is working on implementation and no `Issue.delegate` is currently set, it should set itself as the delegate to make the agent's role in the issue more explicit. 

When work is complete, emit an `AgentActivity` with type `response`; or if you require additional actions from the user, emit an `AgentActivity` with type `elicitation` or `error`. We will automatically create a comment under the comment thread as well.

### Agent Activities

> [!NOTE]
> Comments may not be reliable to read from, as they are editable and may have changed since your agent’s last run. Instead, rely on **Agent Activities** as these are frozen-in-time snapshots of user input.

To reconstruct the full conversation, list the Agent Activities associated with the Agent Session instead—see below for examples:

<details>
<summary>GraphQL</summary>
```graphql
query AgentSession($agentSessionId: String!) {
  agentSession(id: $agentSessionId) {
    activities {
      edges {
        node {
          updatedAt
          content {
            ... on AgentActivityThoughtContent {
              body
            }
            ... on AgentActivityActionContent {
              action
              parameter
              result
            }
            ... on AgentActivityElicitationContent {
              body
            }
            ... on AgentActivityResponseContent {
              body
            }
            ... on AgentActivityErrorContent {
              body
            }
	        ... on AgentActivityPromptContent {
              body
            }
          }
        }
      }
    }
  }
}
```
</details>

<details>
<summary>TypeScript SDK (53.0.0+)</summary>
```ts
// @linear/sdk@^53.0.0
const agentSessionActivities = await agentSession.activities();
agentSessionActivities.nodes.forEach(activity => {
	switch (activity.content.__typename) {
		// type narrowing
		case "AgentActivityThoughtContent":
			const { body } = activity.content;
			...
			break;
		case "AgentActivityActionContent":
			const { action, parameter, result } = activity.content;
			...
			break;
		case "AgentActivityElicitationContent":
			const { body } = activity.content;
			...
			break;
		case "AgentActivityResponseContent":
			const { body } = activity.content;
			...
			break;
		case "AgentActivityErrorContent":
			const { body } = activity.content;
			...
			break;
		case "AgentActivityPromptContent":
			const { body } = activity.content;
			...
			break;
		default:
			throw Error("Not reachable")
	}
})
```
</details>

## Additional Webhooks

In addition to the core `AgentSession` webhooks, there are additional webhooks that your agent can listen to in order to build a richer agent experience within Linear. In addition, you can utilize any of the existing GraphQL APIs.

### Inbox Notifications Webhooks

Inbox Notification events are triggered when something directly involves your app user—like when an agent is unassigned from an issue or a user reacts to a comment from the agent. 

Enable this category by selecting **Inbox Notifications** in your OAuth app config.

The received webhook payload will have the following shape:

```json
{
  type: "AppUserNotification",
  action: NotificationType,
  createdAt: string,
  organizationId: string,
  oauthClientId: string,
  appUserId: string,
  notification: Notification,
}
```

Here are a few action types that could be useful while developing your agent:

```md
issueMention
issueEmojiReaction
issueCommentMention
issueCommentReaction
issueAssignedToYou
issueUnassignedFromYou
issueNewComment
issueStatusChanged
```

### Permission Change Webhooks

Permission Change events are triggered when your agent gains or loses access to a team.

Enable this category by selecting **Permission changes** in your OAuth app config. The webhook will be of type `PermissionChange` with action `teamAccessChanged`.

The received webhook payload will have the following shape when team access is granted or removed:

```json
{
  type: "PermissionChange",
  action: "teamAccessChanged",
  createdAt: string,
  organizationId: string,
  oauthClientId: string,
  appUserId: string,
  canAccessAllPublicTeams: boolean,
  addedTeamIds: string[],
  removedTeamIds: string[],
  webhookTimestamp: number,
  webhookId: string
}

```

You’ll receive a separate webhook when revoking your OAuth app:

```json
{
  type: "OAuthApp",
  action: "revoked",
  createdAt: string,
  organizationId: string,
  oauthClientId: string,
  webhookTimestamp: number,
  webhookId: string
}

```

## Existing integrations

### When to build an integration or agent

If your integration primarily reads data from Linear or performs actions that should be attributed to individual team members, an integration is the right choice.

Build an agent if you want your application to appear as a distinct workspace member with its own identity and actions within Linear. 

### Convert an existing integration

If you have an existing Linear integration it can be converted to use the new authentication and gain the new functionality.

The new `actor=app` actor type works quite differently at the core to our legacy `actor=application` approach. However, if you are using `actor=application` today to request a token that is _only_ used to create issues or comments as an app, then it is backwards compatible – you can simply change this parameter.

`actor=application` allows for dual-purpose authentication tokens that can be used both as the authenticating user in some circumstances and as an "app" in others. If you currently are using a token like this, then to migrate you will need to ask users to authenticate twice: once for their personal access and secondarily for the app installation.

## Feedback, requests, questions

Please join the **#api** channel in our [community Slack](https://linear.app/join-slack) to provide feedback on this guide, request API's, and interact with other engineers developing agentic integrations.
