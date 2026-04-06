<!-- Source: https://linear.app/developers/sdk-errors -->

# Errors

Errors can be caught and inspected by wrapping the operation in a try catch block:

```ts
async function createComment(input: LinearDocument.CommentCreateInput): LinearFetch<Comment | UserError> {
  try {
    /** Try to create a comment */
    const commentPayload = await linearClient.createComment(input);
    /** Return it if available */
    return commentPayload.comment;
  } catch (error) {
    /** The error has been parsed by Linear Client */
    throw error;
  }
}
```

Or by catching the error thrown from a calling function:

```ts
async function archiveFirstIssue(): LinearFetch<ArchivePayload> {
  const me = await linearClient.viewer;
  const issues = await me.assignedIssues();
  const firstIssue = issues.nodes[0];

  if (firstIssue?.id) {
    const payload = await linearClient.archiveIssue(firstIssue.id);
    return payload;
  } else {
    return undefined;
  }
}

archiveFirstIssue().catch(error => {
  throw error;
});
```

The parsed error type can be compared to standard error types with `instanceof` to determine the course of action:

```ts
import { InvalidInputLinearError, LinearError, LinearErrorType } from '@linear/sdk'
import { UserError } from './custom-errors'

const input = { name: "Happy Team" };
createTeam(input).catch(error => {
  if (error instanceof InvalidInputLinearError) {
    /** If the mutation has failed due to an invalid user input return a custom user error */
    return new UserError(input, error);
  } else {
    /** Otherwise throw the error and handle in the calling function */
    throw error;
  }
});
```

Information about the `request` resulting in the error is attached if available:

```ts
run().catch(error => {
  if (error instanceof LinearError) {
    console.error("Failed query:", error.query);
    console.error("With variables:", error.variables);
  }
  throw error;
});
```

Information about the `response` is attached if available:

```ts
run().catch(error => {
  if (error instanceof LinearError) {
    console.error("Failed HTTP status:", error.status);
    console.error("Failed response data:", error.data);
  }
  throw error;
});
```

Any GraphQL `errors` are parsed and added to an array:

```ts
run().catch(error => {
  if (error instanceof LinearError) {
    console.log("The original error", error.raw);
  }
  throw error;
});
```

The `raw` error returned by the `LinearGraphQLClient` is still available:

```ts
run().catch(error => {
  if (error instanceof LinearError) {
    error.errors?.map(graphqlError => {
      console.log("Error message", graphqlError.message);
      console.log("LinearErrorType of this GraphQL error", graphqlError.type);
      console.log("Error due to user input", graphqlError.userError);
      console.log("Path through the GraphQL schema", graphqlError.path);
    });
  }
  throw error;
});
```
