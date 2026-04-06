<!-- Source: https://linear.app/developers/pagination -->

# Pagination

All list responses from queries return paginated results. We implement Relay style cursor-based pagination model with `first`/`after` and `last`/`before` pagination arguments. For example, this is how to query the first 10 issues in your workspace:

```graphql
query Issues {
  issues(first: 10) {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

To query the next 10, simply pass the value of `pageInfo.endCursor` as `after` parameter for the next request. You can do this as long as `pageInfo.hasNextPage` return true and you'll paginate through all the values in the collection.

The first 50 results are returned by default without query arguments. Pagination also supports simpler syntax where instead of edges you can directly get all the nodes similar to GitHub's GraphQL API:

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

By default results are ordered by `createdAt` field. To get most recently updated resources, you can alternatively order by `updatedAt` field:

```graphql
query Issues {
  issues(orderBy: updatedAt) {
    nodes {
      id
      identifier
      title
      createdAt
      updatedAt
    }
  }
}
```
