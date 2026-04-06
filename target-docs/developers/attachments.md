<!-- Source: https://linear.app/developers/attachments -->

# Attachments

Issue attachments allow you to link external resources to issues and display them inside Linear similarly to GitHub Pull Requests. They are designed with API developers in mind and we also use them for upcoming integrations inside Linear.

Example use cases:

* Customer support software where an agent can create a Linear issue
* Release bot that attached release version to an issue

Unique URLs are a core concept with attachments. They enable building stateless applications and integrations which interact with Linear’s API. _Attachment URL is used as an idempotent value if used in conjunction with the same issue id_ so if you try to re-create an attachment with the same URL on the same issue, the original attachment is updated instead. This enables simple scripts which update the attachment content without storing the attachment ID. _You can also query an attachment, and the associated issue, by its URL_. This makes creating links to Linear issues from external application easy and again you don't need to track the attachment ID.

It's recommended to create attachments through Linear's OAuth authentication. Then the application icon is used for the attachment by default, but an icon image URL can be specified when creating the attachment that overrides the application icon. For API key auth, you can also provide an icon URL when creating an attachment. The image provided by URL must be of png or jpg format.

Attachments also support key-value metadata. Values can be any string or number and you can store information there related to your integration. Right now metadata is only exposed through the API but we're also considering exposing it in the UI.

Linear's webhooks also support attachments so you can subscribe to get updates for new and updated attachments.

## Examples

### Create attachment

```graphql
mutation{
  attachmentCreate(input:{
    issueId: "590a1127-f98b-49fc-ba74-2df8751c089e"
    title: "Exception"
    subtitle: "Open"
    url: "http://exception.com/123"
    iconUrl: "https://exception.com/assets/icon.png"
    metadata: {exceptionId: "exc-123"}
  }){
    success
    attachment{
      id
    }
  }
}
```

### Update attachment

```graphql
mutation{
  attachmentUpdate(id: "47e14163-404c-4a34-b775-5c536d67760a", input: {
    title: "Exception"
    subtitle: "Resolved"
    metadata: {exceptionId: "exc-123"}
  }){
    success
    attachment{
      id
    }
  }
}
```

### Query attachment

```graphql
query {
  attachment(id: "47e14163-404c-4a34-b775-5c536d67760a") {
    id
    issue {
      id
      identifier
      title
    }
  }
}

query {
  attachmentsForURL(url: "http://exception.com/123") {
    nodes {
      id
      issue {
        id
        identifier
        title
      }
    }
  }
}
```

## Rich metadata

In addition to generic key-value pairs, `metadata` field can include fields which will be rendered as a rich attachment modal inside Linear. This makes it easier to include data that you would otherwise have to fetch/read by following the attachment link.

Key | Type | Description
--- | --- | ---
`title` | `string` | Title for the modal
`messages` | `{ subject?: string, body?: string, timestamp?: string }[]` | Messages included in the attachment. Subject, body, and timestamp are all optional, but we suggest always populating body. Keep under 10k characters.
`attributes` | `{ name: string, value: string }[]` | Additional attributes which will be rendered in a list.

## Formatting

Format | Type | Output example
--- | --- | ---
`{variableName__since}` | Date as ISO string | "2 days ago", "23 hours ago"
`{variableName__relativeTimestamp}` | Date as ISO string | **If +/- 6 days from current:** "today at 9:30 AM", "Friday at 9:30 AM"

**If > 6 days from current:** "Oct 20, 9:30 AM"

In order to use the date formatting, when creating an attachment provide a date variable (in ISO string format) in the attachment's metadata. You may then add that date with the format `{variableName__since}` into the attachment subtitle. When the attachment is rendered, we will format the time since that date, or format that date and time relative to current time, depending on which format is being used.

```graphql
mutation{
  attachmentCreate(input:{
    issueId: "590a1127-f98b-49fc-ba74-2df8751c089e"
    title: "Exception"
    subtitle: "Detected {detectedAt__since}"
    url: "http://exception.com/123"
    iconUrl: "https://exception.com/assets/icon.png"
    metadata: {detectedAt: "2021-07-06T17:10:32.090Z"}
  }){
    success
    attachment{
      id
    }
  }
}
```

The above query would yield output like the following:

![A Linear attachment with title "Exception" and date formatting that says "Detected 23 hours ago".](https://webassets.linear.app/images/ornj730p/production/cdf10b3df1e13afd5f89236a4bbdd7589595ff41-1056x112.png?q=95&auto=format&dpr=2)
