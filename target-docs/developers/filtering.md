<!-- Source: https://linear.app/developers/filtering -->

# Filtering

Most results that are paginated can also be filtered. This makes it easy to retrieve specific information, like any issues assigned to a particular user, but much more complex queries are also possible. For example, you could fetch all issues associated with a project that is supposed to be completed next week and have not yet been started.

For example, to return all urgent and high priority issues in the workspace, you can use the following query:

```graphql
query HighPriorityIssues {
  issues(filter: { 
    priority: { lte: 2 }
  }) {
    nodes {
      id, title, priority
    }
  }
}
```

The above query will also return any issues that haven’t been given any priority (their priority is 0). To exclude them, you can add another **not equals** comparator:

```graphql
query HighPriorityIssues {
  issues(filter: { 
    priority: { lte: 2, neq: 0 }
  }) {
    nodes {
      id, title, priority
    }
  }
}
```

## Comparators

You can use the following comparators on **string**, **numeric**, and **date** fields:

Comparator | Description
--- | ---
`eq` | Equals the given value
`neq` | Does not equal the given value
`in` | Value is in the given collection of values
`nin` | Value is not in the given collection of values

Numeric and date fields additionally have the following comparators:

Comparator | Description
--- | ---
`lt` | Less than the given value
`lte` | Less than or equal to the given value
`gt` | Greater than then given value
`gte` | Greater than or equal to the given value

String fields additionally have the following comparators:

Comparator | Description
--- | ---
`eqIgnoreCase` | Case insensitive `eq`
`neqIgnoreCase` | Case insensitive `neq`
`startsWith` | Starts with the given value
`notStartsWith` | Does not start with the given value
`endsWith` | Ends with the given value
`notEndsWith` | Does not end with the given value
`contains` | Contains the given value
`notContains` | Does not contain the given value
`containsIgnoreCase` | Case insensitive `contains`
`notContainsIgnoreCase` | Case insensitive `notContains`

Optional values additionally support the `null` comparator, which can be used to return entities depending on whether the field has a value or not. The following query will return all issues that don't have a description:

```graphql
query Issues {
  issues(filter: { 
    description: { null: true }
  }) {
    nodes {
      id, title, description
    }
  }
}
```

## Logical operators

By default, all fields described in the filter need to be matched. The filter merges all the conditions together using a logical **and** operator.

For example, The below example will find all urgent issues that are due in the year 2021.

```graphql
query Issues {
  issues(filter: { 
    priority: { eq: 1 }
    dueDate: { lte: "2021" }
  }) {
    nodes {
      id, title, priority, dueDate
    }
  }
}
```

To change the logical operator, all filters support the **`or`** keyword that lets you switch to a logical **or** operator. For example, to filter for low-priority or un-prioritized issues that need to be completed in the year 2021, you can execute the following query:

```graphql
query Issues {
  issues(filter: { 
    or: [
      { priority: { eq: 4 } },
      { priority: { eq: 0 } }
    ]
    dueDate: { lte: "2021" }
  }) {
    nodes {
      id, title, priority, dueDate
    }
  }
}
```

## Filtering by relationship

Data can also be filtered based on their relations. For example, you can filter issues based on the properties of their assignees. To query all issues assigned to a user with a particular email address, you can execute the following query:

```graphql
query AssignedIssues {
  issues(filter: { 
    assignee: { email: { eq: "john@linear.app" } }
  }) {
    nodes {
      id
      title
      assignee {
        name
      }
    }
  }
}
```

Many-to-many relationships can be filtered similarly. The following query will find issues that have the **Bug** label associated.

```graphql
query Issues {
  issues(filter: { 
    labels: { name: { eq: "Bug" } }
  }) {
    nodes {
      id, title
    }
  }
}
```

The above query returns all issues that have at least one label that matches the name **Bug**. To create a query where all labels on an issue are matched to the filter criteria, you can use the **`every`** keyword:

```graphql
query Issues {
  issues(filter: { 
    labels: { every: { name: { eq: "Bug" } } }
  }) {
    nodes {
      id, title
    }
  }
}
```

The above would also filter out issues that have multiple labels, regardless of what they are.

## Relative time

All date fields support relative time, defined as [ISO 8601 durations](https://en.wikipedia.org/wiki/ISO_8601#Durations) relative to the current date. This lets you create a filter that always returns all issues that are due in the next 2 weeks, regardless of when you run it:

```graphql
query IssuesDue {
  issues(filter: { 
    dueDate: { lt: "P2W" }
  }) {
    nodes {
      id, title
    }
  }
}
```

## Examples

Find all **bugs** and **defects** from projects that are lead by any user named "**John**":

```graphql
query Projects {
  projects(filter: { 
    lead: { name: { startsWith: "John" } } 
  }) {
    nodes {
      issues(filter: { 
        labels: { name: { in: ["Bug", "Defect"] } } 
      }) {
        nodes {
          id
          title
        }
      }
    }
  }
}
```

Find all issues assigned to me that have a comment containing a thumbs-up emoji:

```graphql
query Issues {
  viewer {
    assignedIssues(filter: { 
      comments: { body: { contains: "👍" } } 
    }) {
      nodes {
        id
        title
      }
    }
  }
}
```

Find all issues that have been created by me and have been closed in the past two weeks:

```graphql
query ClosedIssues {
  viewer {
    createdIssues(filter: { completedAt: { gt: "-P2W" } }) {
      nodes {
        id, title
      }
    }
  }
}
```

Find all started issues in ongoing projects that don't have an estimate:

```graphql
query Issues {
  issues(
    filter: {
      estimate: { eq: 0 }
      state: { type: { eq: "started" } }
      project: { state: { eq: "started" } }
    }
  ) {
    nodes {
      title
      estimate
      project {
        name
      }
    }
  }
}
```
