<!-- Source: https://linear.app/developers/sdk-webhooks -->

# Webhooks

The SDK provides a helper class to help you start listening to Linear [webhook events](https://linear.app/developers/webhooks) quickly. 

Use `LinearWebhookClient` to create a typed, signature-verified event listener that can be mounted on Bun, Fastify, Express, or other server frameworks, so you can start working with webhook events with minimal boilerplate.

```ts
import express from "express";
import { LinearWebhookClient } from "@linear/sdk/webhooks";

// Example with Express
const app = express();
const webhookClient = new LinearWebhookClient("WEBHOOK_SECRET");

// Create a handler
const handler = webhookClient.createHandler();

// Handle the webhook event
handler.on("Issue", (payload) => {
  console.log(payload.data.title);
  ...
});

// Mount handler to server
app.post("/hooks/linear", handler);
```

> [!NOTE]
> Ensure no middleware (e.g., body parser) consumes the raw request body before the handler! Linear signs the exact raw body, so signature verification will fail if any parsing occurs beforehand.

It also provides a helper to verify [webhook signatures](https://linear.app/developers/webhooks#securing-webhooks), in case you'd like to handle the webhook events manually: 

```ts
import { 
  LinearWebhookClient,
  LINEAR_WEBHOOK_SIGNATURE_HEADER, 
  LINEAR_WEBHOOK_TS_FIELD
} from '@linear/sdk/webhooks';
 
const webhookClient = new LinearWebhookClient("WEBHOOK_SECRET");

...

// Example with Express
app.use(
  "/hooks/linear",
  bodyParser.json({
    verify: (req, res, buf) => {
      webhookClient.verify(
        buf,
        req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER] as string,
        JSON.parse(buf.toString())[LINEAR_WEBHOOK_TS_FIELD],
      );
    },
  }),
  (req, res, next) => {
    // Handle the webhook event
    next();
  },
);
```
