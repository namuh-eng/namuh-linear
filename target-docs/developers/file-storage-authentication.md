<!-- Source: https://linear.app/developers/file-storage-authentication -->

# File storage authentication

Files uploaded to Linear, such as images and attachments, are stored in Linear's private cloud storage. You must authenticate to access these files. These files are accessible from the `https://uploads.linear.app` hostname.

## Authorization Header

You can pass the same access token and `authorization` header as you would when making requests to our GraphQL API when requesting files from storage. This is usually the best option when downloading files in a server environment. An example request might look something like:

```http
curl https://uploads.linear.app/6db02bb9-fba2-473b-8f9d-f38188e84813/d20adbea-186d-4643-ad07-004bda7d099d  \
  -X GET \
  -H 'Authorization: Bearer 00a21d8b0c4e2375114e49c067dfb81eb0d2076f48354714cd5df984d87b67cc'
```

## Request Signed URLs

When using the GraphQL API, you can request that all URLs in responses pointing to file storage include a signature which allows temporary access to the file. This is achieved by passing the `public-file-urls-expire-in` header with an integer value representing the signature expiration in seconds.

With the [TypeScript SDK](https://linear.app/developers/sdk) this header can be set directly on the client. Here is an example to receive signatures that are valid for 1 minute:

```ts
const client = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
  headers: {
    "public-file-urls-expire-in": "60",
  }
});
```
