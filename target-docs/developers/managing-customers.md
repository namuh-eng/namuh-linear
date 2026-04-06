<!-- Source: https://linear.app/developers/managing-customers -->

# Managing Customers

The Customers requests feature allows you to manage customers and requests inside of Linear.

## Data Models

The Customer requests relies on two objects: `Customer` and `CustomerNeed`.

### `Customer`

The `Customer` object represents an external company.

#### Fields

Field | Type | Description
--- | --- | ---
`id` | string | The id of the Customer in Linear.
`name` | string | The name of the Customer.

### `CustomerNeed`

The `CustomerNeed` object represents a customer request. It’s attached to an `Issue` and optionally, to a specific `Customer`.

#### Fields

Field | Type | Description
--- | --- | ---
`customerId` | `uuid` | The `id` of the Customer in Linear this request is associated with. Can be `undefined` if the request is not attached to a Customer.
`issueId` | `uuid` | The `id` of the Issue this request is associated with.
`attachmentId` | `uuid` | The `id` of the Attachment this request is associated with. All requests with a source URL are backed by an Attachment.
`priority` | `number` | Whether the customer request is important or not. `0` = Not important, `1` = Important.
`body` | `string` | Optional content for the request, in markdown format.
`creatorId` | `uuid` | The `id` of the User in Linear who created the request.

## Create a Customer

The [`customerCreate`](https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference/objects/Mutation#customerCreate) mutation allows to create a customer through the API:

```graphql
mutation CustomerCreate($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    success
    customer {
      id
    }
  }
}

{
  "input": {
    "name": "ACME"
  }
}
```

```json
{
  "data": {
    "customerCreate": {
      "success": true,
      "customer": {
        "id": "bc993fb1-bf7e-48ab-aff9-2d014cfc5842"
      }
    }
  }
}
```

### Customer with metadata

The following request creates a customer with additional metadata:

* `tierId` is the id of Linear tier this customer is associated with. Tiers must be created with mutation `customerTierCreate` before they can be used with a Customer
* `externalIds` contains a list of all unique external identifiers for this Customer. It can be the uuid of the Customer in your own database or any other external system you are getting customer information from. Setting this value allows to refer to this customer by this specific external id when creating customer requests rather than the Linear defined Customer id.
* `domains` must contain unique values and cannot contain any public email provider.

```graphql
mutation CustomerCreate($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    success
    customer {
      id
    }
  }
}

{
  "input": {
    "name": "ACME",
    "domains": ["acme.com"],
    "externalIds": ["cus-acme-12345"]
    "tierId": "e7cfd601-5582-41aa-8f52-77685191e221",
    "revenue": 1250,
    "size": 12,
  }
}
```

## Create a Customer Request

Once a Customer has been created, it is possible to use it to create a Customer Request on a specific issue.

```graphql
mutation CustomerNeedCreate($customerNeedCreateInput: CustomerNeedCreateInput!) {
  customerNeedCreate(input: $customerNeedCreateInput) {
    success
  }
}

{
 "input": {
   "issueId": "be65eaec-314c-412c-baf8-4787f2b85bdd",
   "body": "Content of the request",
   "customerId": "021d4b25-b0a9-4f02-85ad-bd840ac9c3ee" 
 }
}
```

Alternatively, it is possible to use one of the external id of the Customer to attach the request to the Customer:

```graphql
mutation CustomerNeedCreate($customerNeedCreateInput: CustomerNeedCreateInput!) {
  customerNeedCreate(input: $customerNeedCreateInput) {
    success
  }
}

{
 "input": {
   "issueId": "be65eaec-314c-412c-baf8-4787f2b85bdd",
   "body": "Content of the request",
   "customerExternalId": "cus-acme-12345"
 }
}
```

When passing an `url` to the input, an `Attachment` will be created and attached to the request:

```graphql
mutation CustomerNeedCreate($customerNeedCreateInput: CustomerNeedCreateInput!) {
  customerNeedCreate(input: $customerNeedCreateInput) {
    success
  }
}

{
 "input": {
   "issueId": "be65eaec-314c-412c-baf8-4787f2b85bdd",
   "body": "Content of the request",
   "customerExternalId": "cus-acme-12345",
   "attachmentUrl": "https://conversations.support.com/conversations/12345"
 }
}
```

```json
{
  "data": {
    "customerNeedCreate": {
      "success": true,
      "need": {
        "id": "26c9dbf5-44b5-4e00-9978-c779467d87f0",
        "body": "Content of the request",
        "attachment": {
          "url": "https://conversations.support.com/conversations/12345"
        }
      }
    }
  }
}
```

## Update a Customer

The [`customerUpdate`](https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference/objects/Mutation?query=customerUpdate#customerUpdate) mutation allows to update a Customer. Linear will automatically attempt to match created Customers against customers in your integrations (Intercom, Zendesk or Front). When a match happens, the Customer object in Linear becomes managed by the integration and only certain fields can be updated.

Integration | Allowed fields
--- | ---
[Intercom](https://linear.app/docs/intercom) | ```ts
"ownerId" | "statusId" | "logoUrl"
```
[Zendesk](https://linear.app/docs/zendesk) or [Front](https://linear.app/docs/front) | ```ts
"ownerId" | "statusId" | "logoUrl" | "revenue" | "size" | "tierId"
```

If you are building an integration with Linear and need to manage or operate with Customers that could have been created by other integrations, please refer to the [Upsert Customers](https://linear.app/developers/managing-customers#upsert-customers) section

## Upsert Customers

Customers are created automatically when an issue is created from one of the supported sources: Intercom, Zendesk, Front, Email intake or Slack. If you are building an integration that will create Customer Requests and associate them with Customers, it is likely that you will encounter the case where the request should be attached to a Customer that's been already created by another integration. As there is a uniqueness constraint on `domains`, you cannot create a duplicate Customer in Linear. Instead, you must re-use this existing Customer. The `customerUpsert` mutation allows you to append domains and external identifiers to an existing Customer and contribute to its definition.

Starting with the following Customer, assuming it has been created by the Intercom integration:

```json
{
    "name": "ACME",
    "domains": ["acme.com"],
    "externalIds": ["intercom-654536452625"]
    "revenue": 1250,
    "size": 12,
}
```

It is possible to upsert this existing Customer with your integration's own definition:

```graphql
mutation CustomerUpsert($customerUpsertInput: CustomerUpsertInput!) {
  customerUpsert(input: $customerUpsertInput) {
    success
    customer {
      domains
      name
      externalIds
    }
  }
}

{
  "customerUpsertInput": {
    "domains": ["acme.com", "acme.dev"],
    "externalId": "own-customer-id",
  }
}
```

```json
{
  "data": {
    "customerUpsert": {
      "success": true,
      "customer": {
        "domains": [
          "acme.com",
          "acme.dev"
        ],
        "name": "ACME",
        "externalIds": [
          "cus-acme-12345",
          "own-customer-id"
        ]
      }
    }
  }
}
```

Your integration's Customer id has been appended to the list of `externalIds` of the Customer, after it matched by domain. If there had been no match, a new Customer would have been created.

This allows your integration to push Customers into Linear without having to check ahead of time if there is already an existing Customer for the same domains. Either the Customer does not exist and will be created, either it exists already and will be reused. The `domains` and `externalIds` will be merged.

Your integration can then attach Customer Requests using your integration's customer id:

```graphql
mutation CustomerNeedCreate($customerNeedCreateInput: CustomerNeedCreateInput!) {
  customerNeedCreate(input: $customerNeedCreateInput) {
    success
  }
}

{
 "input": {
   "issueId": "be65eaec-314c-412c-baf8-4787f2b85bdd",
   "body": "Content of the request",
   "customerExternalId": "own-customer-id",
   "attachmentUrl": "https://conversations.support.com/conversations/12345"
 }
}
```
