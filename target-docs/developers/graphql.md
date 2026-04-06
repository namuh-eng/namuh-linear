<!-- Source: https://linear.app/developers/graphql -->

# Getting started

Linear's public API is built using GraphQL. It's the same API we use internally for developing our applications. If you are new to GraphQL, Apollo has [resources for beginners](https://blog.apollographql.com/the-basics-of-graphql-in-5-links-9e1dc4cac055). The official [GraphQL documentation](https://graphql.org/) is another good starting point.

## Endpoint

Linear's GraphQL endpoint is:

```http
https://api.linear.app/graphql
```

It supports introspection so you can query the whole schema.

## Authentication

The Linear API supports personal API keys and OAuth2 authentication.

### OAuth

If you’re building an application for others to use, we recommend you use [OAuth2 authentication](https://linear.app/developers/oauth-2-0-authentication). Once you complete the authentication flow and acquire an access token, pass it with the header `Authorization: Bearer <ACCESS_TOKEN>`

```sh
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  --data '{ "query": "{ issues { nodes { id title } } }" }' \
  https://api.linear.app/graphql
```

### Personal API Keys

For personal scripts API keys are the easiest way to access the API. Visit [Security & access](https://linear.app/settings/account/security) settings to create and manage them.

To authenticate your requests, you need to pass the API key with header: `Authorization: <API_KEY>`

```sh
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: <Replace this with your API Key>" \
  --data '{ "query": "{ issues { nodes { id title } } }" }' \
  https://api.linear.app/graphql
```

## Error handling

Linear's GraphQL API follows the standard GraphQL error format, returning errors within an errors array in the response. Each error object includes a message describing what went wrong, a path array indicating where in the query the  
error occurred, and extensions that may contain additional context such as error codes or validation details. 

Always check for the errors array before assuming success—GraphQL queries can partially succeed with a 200 HTTP status, returning some data while  
including errors for failed fields. Monitor HTTP status codes for server errors (5xx) and make sure to correctly handle [rate limits](https://linear.app/developers/rate-limiting). Use strongly-typed GraphQL clients when possible to catch validation errors at development time, and always validate required fields to avoid runtime null value errors.

## Linear SDK

The [Linear SDK](https://linear.app/developers/sdk) exposes the Linear GraphQL schema, and makes it easy to access models, or perform mutations. We recommend using it to interact with the GraphQL API. It is written in TypeScript, allowing all operations to be strongly typed.

## Getting Started

> [!NOTE]
> We recommend using a GraphQL client to introspect and explore the schema if you are not using the Linear Client (SDK).
> 
> Our GraphQL API is explorable and queryable via [Apollo Studio](https://studio.apollographql.com/public/Linear-API/variant/current/home), no download or log in required. Click the Schema tab to browse the schema, and click the Explorer tab to run queries.

Once you have your client installed, you can start making queries (read) and mutations (write) to the API.

### Queries & Mutations

To get information about the authenticated user, you can use the `viewer` query:

```graphql
query Me {
  viewer {
    id
    name
    email
  }
}
```

As issues (and most other objects) are team based, you first need to get the ID of the team you want to interact with:

```graphql
query Teams {
  teams {
    nodes {
      id
      name
    }
  }
}
```

Once you have found the correct team, you can get the issues for that team. Lets make a request with also some other issue metadata:

```graphql
query Team {
  team(id: "9cfb482a-81e3-4154-b5b9-2c805e70a02d") {
    id
    name

    issues {
      nodes {
        id
        title
        description
        assignee {
          id
          name
        }
        createdAt
        archivedAt
      }
    }
  }
}
```

We can also get an issue by id:

```graphql
query Issue {
  issue(id: "BLA-123") {
    id
    title
    description
  }
}
```

> [!NOTE]
> Locate the IDs of teams, issues and other entities directly within Linear itself from the command menu: `Cmd/Ctrl+K` and "Copy model UUID". This will show results based on the page you're currently viewing within Linear.

### Creating & Editing Issues

To create a new issue, use a mutation:

```graphql
mutation IssueCreate {
  issueCreate(
    input: {
      title: "New exception"
      description: "More detailed error report in markdown"
      teamId: "9cfb482a-81e3-4154-b5b9-2c805e70a02d"
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

This mutation will create a new issue and return its `id` and `title` if the call was successful (`success: true`).

> [!NOTE]
> If an issue is created without a specified `stateId`(the status field for the issue), the issue will be assigned to the team's first state in the Backlog workflow state category. If the "Triage" feature is turned on for the team, then the issue will be assigned to the Triage workflow state.

A common use case after creating an issue is updating the issue. To do this we can use the `issueUpdate` mutation, using the input field to include whatever it is we want to change. The `id` provided can be either be the uuid returned by the creation query, or the shorthand id like `BLA-123` below.

```graphql
mutation IssueUpdate {
  issueUpdate(
    id: "BLA-123",
    input: {
      title: "New Issue Title"
      stateId: "NEW-STATE-ID",
    }
  ) {
    success
    issue {
      id
      title
      state {
        id
        name
      }
    }
  }
}
```

> [!NOTE]
> Changes made to an issue's properties in the first 3 minutes are considered part of the issue creation process, and won't be added to the activity log as changes to the issue.

### Accessing Images

Linear hosts images and other assets uploaded into Linear behind authentication. Only authenticated users can view their assets. This also applies to the API and all images will require authentication to be displayed outside Linear's application. Regular [API authentication](https://linear.app/developers/graphql#authentication) (OAuth or API keys) is accepted for displaying images. If you're displaying images outside Linear's applications, you should download and self-host them in your application's environment.

### Adding mentions in Markdown

In the Linear application, you can add mentions to users, issues, projects, and other resources by typing @ and then selecting a resource to mention.

In the GraphQL API, mentions can be created in Markdown by using the plain URL of the resource. For example:

```md
https://linear.app/yourworkspaceurl/profiles/someuser what do you think about
https://linear.app/yourworkspaceurl/issue/LIN-123/some-issue here?
```

Will convert into:

> **@user**, what do you think about ,**@LIN-123 some issue**, here?

Where the bolded segments are mentions.

### Adding collapsible sections in Markdown

For collapsible sections in an issue, comment, or document, use `+++ [some section title]` to start the section and `+++` to end it.

```md
+++ Section title

Markdown content (initially hidden)

+++
```

### Fetching Updates

If you're working on building an application which displays Linear data and you want the information to update (near) realtime, you have few options. To prevent excessive usage of our API, we recommend that you be mindful about your implementation.

Lets say you're displaying a big number of issues in your application and want to update them:

  
**Do:**

* Register [a programmatic webhook](https://linear.app/developers/webhooks) and get updates for all issues for the team. When you detect changes, update the issue information. You can also automatically register webhooks for OAuth applications.
* If you have to poll recent changes, order results by returning recently updated issue first. See [Pagination](https://linear.app/developers/pagination) section above how to implement this
* [Filter issues](https://linear.app/developers/filtering) in your GraphQL request instead of fetching all issues and filtering in code.

**Don't:**

* Poll updates for each issue in the application. There should never be a reason to do this and your application might get rate limited. See above tactics to implement this better

If you have any questions, visit the **#api** channel on our [customer Slack](https://linear.app/join-slack).

### Other Examples

#### Queries

There are many ways to fetch issues. One common use case is to get all the issues assigned to a user.

First let's find our user's id:

```graphql
query {
  users {
    nodes {
      name
      id
    }
  }
}
```

Now we can use the `assignedIssues` field on User:

```graphql
query {
  user(id: "USERID") {
    id
    name
    assignedIssues {
      nodes {
        id
        title
      }
    }
  }
}
```

We can do the same thing with `workflowStates` which represent status fields for teams:

```graphql
query {
  workflowStates {
    nodes {
      id
      name
    }
  }
}

query {
  workflowState(id: "WORKFLOW_ID") {
    issues {
      nodes {
        title
      }
    }
  }
}
```

#### Archived resources

Archived resources are hidden by default from the paginated responses. They can be included by passing optional `includeArchived: true` as a query parameter for pagination.

## Support

If you run into problems or have questions or suggestions, you can join our customer Slack or send us a note ([hello@linear.app](mailto:hello@linear.app)). Both options are available through the user menu in the Linear application.
