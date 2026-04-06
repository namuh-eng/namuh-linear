<!-- Source: https://linear.app/developers/agents -->

# Getting Started

This guide describes how to best integrate an AI agent into Linear. It includes implementation guidelines on how to design an experience that feels native to Linear’s workflows and interaction patterns.

**Developer Preview**

Linear for Agents APIs are currently in active development and available as a Developer Preview. Functionality and Agent APIs may change before general availability. 

## Overview

Agents behave similar to other users in a workspace. They can be @mentioned, delegated issues through assignment, create and reply to comments, collaborate on projects and documents, etc. App users are installed and managed by workspace admins.

You can build agents for internal use within your own workspace or for distribution to other organizations. It does not cost anything to develop agents in Linear. To make your agent available to other workspaces, [submit](https://linear.app/docs/integration-directory#submit-your-integration) your agent to Linear's integration directory.

Additionally, agents installed in your workspace do not count as billable users.

> [!NOTE]
> **Sample agent**
> We've created a demo agent built on our Typescript SDK and Cloudflare, if you want to dive straight into an example codebase. 
> 
> [Weather Bot](https://github.com/linear/weather-bot) is an agent that will help you look up the weather of any location within a Linear issue.

## Setup

Create a new [Application](https://linear.app/settings/api/applications/new) and configure the settings as you would for a standard OAuth application.

In the configuration, enable webhooks and make sure to select **Agent session events** at the bottom. Enabling this category will notify your webhook when events occur that are directly relevant to your app's user.

> [!NOTE]
> Note that the name and icon of your application will be how the agent appears in workspaces where it is installed (e.g. in the mention and filter menus), so it is best to choose something short, recognizable, but unique.

If you're just getting started, selecting Inbox notifications and Permission changes may also be helpful. You can read more about these in [Interaction Best Practices](https://linear.app/developers/agent-best-practices).

## Authentication

### Actor and scopes

App authentication is built on top of the standard [OAuth2](https://linear.app/developers/oauth-2-0-authentication) flow. To install your agent into a Linear workspace in the OAuth authorization url add the `actor=app` parameter to switch to an app installation rather than requesting authentication as the installing user. Because this will be installed with a workspace scope _admin permissions are required_ to complete the installation.

This new actor type supersedes any references to `actor=application` and can be used for all agent, app, and service account use-cases.

#### Mention + assign scopes

To allow for flexibility, the ability to mention and assign your agent is optional and must be requested through the use of two new additional scopes added to the `scope` query parameter:

Scope | Description
--- | ---
app:assignable | Allow the app to be assigned as a delegate on issues and made a member of projects
app:mentionable | Allow the app to be mentioned in issues, documents, and other editor surfaces

Assigning an issue to your app now sets it as the `delegate`, not the `assignee`—so humans maintain ownership while agents act on their behalf.

#### Customer access scopes

The ability to access customer-related entities in your workspace for your agent must be requested through scopes:

Scope | Description
--- | ---
customer:read | Allow the app to read customer data in the workspace
customer:write | Allow the app to read and write customer data in the workspace

#### Initiative access scopes

The ability to access initiative-related entities in your workspace for your agent must be requested through scopes:

Scope | Description
--- | ---
initiative:read | Allow the app to read initiative data in the workspace
initiative:write | Allow the app to read and write initiative data in the workspace

#### Admin

Note that integrations using the `actor=app` mode are not able to also request `admin` scope.

### Installation

Your app will have a _unique ID for each workspace_ it is installed within, you can find this ID with the following query using the OAuth access token received as part of the installation flow:

```graphql
query Me {
  viewer {
    id
  }
}
```

We highly recommend storing this ID alongside your access token so that you can confidently identify your app in different workspaces.

### Management

The team access available to your app can be changed or revoked at any time by workspace admins. If you're subscribed to the **Permission changes** webhook category, a `PermissionChange` webhook will be sent when access changes occur.

---

## Agent session lifecycle

Once installed and authenticated, your agent is ready to interact in the workspace. The core interaction model centers around the [**Agent Session**](https://linear.app/developers/agent-interaction#agent-session), which tracks the lifecycle of a given agent task. Sessions are created automatically when an agent is mentioned or delegated an issue.

Session state is visible to users, and updated automatically based on the agent’s emitted activities. No manual state management is required.

### Receiving your first webhook

The most common entry point is delegation—when a user assigns an issue to your agent.

This triggers a `created` AgentSessionEvent webhook containing an `agentSession` object with the relevant issue, comment, and context.

To get started, your agent should:

* Emit a `thought` activity within 10 seconds to acknowledge the session has begun
* Use the [`promptContext`](https://linear.app/developers/agent-interaction?noRedirect=1#collapsible-6a944bd6e1df) field to construct a formatted string containing the session’s relevant context, such as issue details, comments, and guidance

Details on the Agent Session webhook structure and how to respond using Agent Activities in [Developing the Agent Interaction](https://linear.app/developers/agent-interaction).
