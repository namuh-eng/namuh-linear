<!-- Source: https://linear.app/developers/advanced-usage -->

# Advanced usage

The Linear Client wraps the [Linear SDK](https://github.com/linear/linear/tree/master/packages/sdk/src/_generated_sdk.ts), provides a [LinearGraphQLClient](https://github.com/linear/linear/tree/master/packages/sdk/src/graphql-client.ts), and [parses errors](https://github.com/linear/linear/tree/master/packages/sdk/src/error.ts).

## Request Configuration

The `LinearGraphQLClient` can be configured by passing the `RequestInit` object to the Linear Client constructor:

```ts
const linearClient = new LinearClient({ apiKey, headers: { "my-header": "value" } });
```

## Raw GraphQL Client

The `LinearGraphQLClient` is accessible through the Linear Client:

```ts
const graphQLClient = linearClient.client;
graphQLClient.setHeader("my-header", "value");
```

## Raw GraphQL Queries

The Linear GraphQL API can be queried directly by passing a raw GraphQL query to the `LinearGraphQLClient`:

```ts
const graphQLClient = linearClient.client;
const cycle = await graphQLClient.rawRequest(`
  query cycle($id: String!) {
    cycle(id: $id) {
      id
      name
      completedAt
    }
  }`,
  { id: "cycle-id" }
);
```

## Custom GraphQL Client

In order to use a custom GraphQL Client, the Linear SDK must be extended with a request function:

```ts
import { LinearError, LinearFetch, LinearRequest, LinearSdk, parseLinearError, UserConnection } from "@linear/sdk";
import { CustomGraphqlClient } from "./graphql-client";

/** Create a custom client configured with the Linear API base url and API key */
const customGraphqlClient = new CustomGraphqlClient("https://api.linear.app/graphql", {
  headers: { Authorization: apiKey },
});

/** Create the custom request function */
const customLinearRequest: LinearRequest = <Response, Variables>(
  document: string,
  variables?: Variables
) => {
  /** The request must take a GraphQL document string and variables, then return a promise for the result */
  return customGraphqlClient.request<Data>(document, variables).catch(error => {
    /** Optionally catch and parse errors from the Linear API */
    throw parseLinearError(error);
  });
};

/** Extend the Linear SDK to provide a request function using the custom client */
class CustomLinearClient extends LinearSdk {
  public constructor() {
    super(customLinearRequest);
  }
}

/** Create an instance of the custom client */
const customLinearClient = new CustomLinearClient();

/** Use the custom client as if it were the Linear Client */
async function getUsers(): LinearFetch<UserConnection> {
  const users = await customLinearClient.users();
  return users;
}
```
