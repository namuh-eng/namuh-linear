<!-- Source: https://linear.app/developers/aig -->

# Agent Interaction Guidelines (AIG)

Agents are changing how software is planned, built, reviewed, and deployed. Because agents produce work in abundance, roles and workflows get reshaped. The value shifts to orchestrating input, context engineering, and reviewing output.

This shift demands a new contract for human‑computer interaction. The Agent Interaction Guidelines (AIG) are the foundational, evolving principles and practices for designing agent interactions that integrate more naturally into human workflows.

## Principles & practices

### **An agent should always disclose that it's an agent**

When humans and agents work side by side, humans need instant certainty about who they are interacting with. The agent must signal its identity clearly so that it can never be mistaken for a person.

![A screenshot of a user dropdown menu listing both agentic and human users. Agents are clearly marked as agents with a small badge.](https://webassets.linear.app/images/ornj730p/production/1a4bc3ce7dc27a80d2f83b5ac18638a928fdb2d3-1248x756.png?q=95&auto=format&dpr=2)
*Clear boundary between human and agentic users*

### **An agent should inhabit the platform natively**

By default, agents should be able to work through existing UI patterns and standard actions of the platform they operate in.

![A screenshot of an issue activity feed in Linear that shows how an agent changes the issue status and links a GitHub issue.](https://webassets.linear.app/images/ornj730p/production/ff59cea32f96906acb15e66fec4154f573e4db0e-1248x756.png?q=95&auto=format&dpr=2)
*The agent is able to use the same actions a human user would*

### **An agent should provide instant feedback**

Silence leads to uncertainty. When invoked, an agent should provide immediate, but unobtrusive, feedback to reassure the user it has received a request.

![A screenshot of a comment thread in Linear. A human user asks the coding agent to take a look at a bug. The agent instantly replies with a "Thinking" indicator.](https://webassets.linear.app/images/ornj730p/production/0b883b9c94ff358dfae949937d8a85a43e80cc57-1248x756.png?q=95&auto=format&dpr=2)
*The agent instantly indicates that it’s processing the request*

### **An agent should be clear and transparent about its internal state**

Agents should clearly indicate whether they’re thinking, waiting for input, executing, or finished working. Humans should be able to understand what’s happening at a glance and, when needed, inspect the underlying reasoning, tool calls, prompts, and decision logic.

![A screenshot of "Agent Session" showing every step of the agent's thought process](https://webassets.linear.app/images/ornj730p/production/b18e90e043a254b145b536530870fbc1bc4c786d-1248x756.png?q=95&auto=format&dpr=2)
*The agent’s reasoning is fully transparent and open to inspection*



### **An agent should respect requests to disengage**

When asked to disengage, an agent should step back, immediately – and only re-engage once it’s received a clear signal to do so.

### **An agent cannot be held accountable**

There should be a clear delegation model between humans and agents. An agent can carry out tasks, but the final responsibility should always remain with a human.

![A screenshot of an issue that's been delegated to an agent. The UI makes it clear that there is still a human user who is responsible for the issue.](https://webassets.linear.app/images/ornj730p/production/97805cb8635416aaf12792f1c91f2d98739647f1-1248x756.png?q=95&auto=format&dpr=2)
*Clear delegation flow between human and agent*

## Get involved

The Agent Interaction Guidelines are written with the community in mind. If you’re building agents and thinking through these same challenges, [join our Slack community](https://linear.app/join-slack) to contribute to the conversation.

This page is a living document and we expect to continually add to it as we learn more in practice.

---

![A footer image with a Linear logo and an AIG logo](https://webassets.linear.app/images/ornj730p/production/008597cc690fe6cba9f57fd8c2f49fcca52b7989-1344x250.png?q=95&auto=format&dpr=2)
