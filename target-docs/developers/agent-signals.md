<!-- Source: https://linear.app/developers/agent-signals -->

# Signals

Signals are optional metadata that modify how an [Agent Activity](https://linear.app/developers/agent-interaction#agent-activity) should be interpreted or handled by the recipient. They provide additional context about the sender’s intent—guiding how the activity should be processed or responded to.

Both agents and human users can attach signals to Agent Activity they create. This helps ensure that downstream behavior aligns with the sender’s expectations, whether it’s prompting a specific response type or adjusting how an action is displayed or prioritized.

## Human-to-agent signals

Human-to-agent signals are signals set by human users on Agent Activities of type `prompt`. They provide additional context or intent that guides how an agent should interpret or respond to a user’s message.

These signals are only applicable to `prompt`-type Agent Activities.

### `stop`

> [!NOTE]
> Applicable to Agent Activities of type [prompt](https://linear.app/developers/agent-interaction#activity-content-payload).

**The `stop` signal instructs the agent to halt work immediately.** From the moment this signal is received, the agent must not perform any further actions—such as making code changes, updates, or additional API calls. 

After disengaging, the agent should emit a final activity—either of type `response` or `error`—to confirm that it has stopped and to inform the user of its current state.

An Agent Activity with the `stop` signal is generated when a user requests the agent to stop from within Linear.

![An entry in a dropdown menu that reads "Send stop request"](https://webassets.linear.app/images/ornj730p/production/37e8278beff74fb64089511e264ebe6d258ec3ce-977x557.png?q=95&auto=format&dpr=2)

## Agent-to-human signals

Agents can include signals when emitting Agent Activities. Signals are added through the `signal` field, alongside the `content` field, to convey additional context or intent to human users.

### `auth`

> [!NOTE]
> Applicable to Agent Activities of type [elicitation](https://linear.app/developers/agent-interaction#collapsible-612479899bd6).

The `auth` signal indicates that the agent requires the user to complete an account linking process before it can continue. When this signal is present, Linear renders a temporary UI state containing a link for the user to complete the account linking flow. This UI is ephemeral and will be dismissed once a newer agent-initiated activity is received.

After the required action is completed, the agent should resume work by emitting a `thought` activity.

Sample payload for [agentActivityCreate](https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference/objects/Mutation#agentActivityCreate) mutation: 

```javascript
{
  agentSessionId: "...",
  content: {
    type: "elicitation",
    body: "Please authenticate to continue"
  },
  signal: "auth",
  signalMetadata: {
    url: "https://auth.example.com/oauth",
    userId: "...",        // Optional: restricts to a specific user
    providerName: "Orbit" // Optional: identifies the authentication provider
  }
}
```

![A human user commenting "@Botcoder Please implement this", and a row below containing a button "Link account" and text "Link your account to continue."](https://webassets.linear.app/images/ornj730p/production/bd840d1bb5075dbbcf687142aabf978d547bbfa4-855x242.png?q=95&auto=format&dpr=2)
*Normal View – Targeted User*

![A human user commenting "@Botcoder Please implement this", and a row below containing "Waiting for (human username) to link their account."](https://webassets.linear.app/images/ornj730p/production/99dfcf3007764b2b3646e31539d42cb7584b18b1-844x235.png?q=95&auto=format&dpr=2)
*Alt View – Non-target User*

### `select`

> [!NOTE]
> Applicable to Agent Activities of type [elicitation](https://linear.app/developers/agent-interaction#collapsible-612479899bd6).

The `select` signal presents a list of options for the user to choose from as part of an elicitation activity. It’s useful for confirmations, selecting a target (such as a GitHub repository), or any situation with multiple choices.

**Users aren’t required to pick an option**—they can reply in free text, which dismisses the elicitation. Any selected option is emitted as a regular `prompt` activity. And since responses may include natural language, your agent should always involve an LLM when interpreting the prompt.

Each option may include both a `label` and a `value` and values can differ. GitHub repository URL options may render with enriched displayed content even if no `label` is provided.

Sample payload for [agentActivityCreate](https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference/objects/Mutation#agentActivityCreate) mutation: 

```javascript
{
  agentSessionId: "...",
  content: {
    type: "elicitation",
    body: "Which package in the monorepo are you referring to?"
  },
  signal: "select",
  signalMetadata: {
    options: [
      {
        label: "frontend",
        value: "src/packages/frontend"
      },
      {
        label: "backend",
        value: "src/packages/backend"
      }
      // ...
    ]
  }
}
```

![Video](https://webassets.linear.app/files/ornj730p/production/e2d4a504b762590ec6dbd454e1190db1bdd01ee7.mp4)
