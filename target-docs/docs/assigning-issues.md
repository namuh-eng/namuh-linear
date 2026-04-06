<!-- Source: https://linear.app/docs/assigning-issues -->

# Assign and delegate issues

![Linear issue detail view showing an issue labeled 'In Progress' assigned to a teammate and delegated to an agent, with both assignee and delegated agent avatars shown in the properties sidebar.](https://webassets.linear.app/images/ornj730p/production/849fbda44425eeaac774029ed969ea3aaa395b3d-1561x1217.png?q=95&auto=format&dpr=2)

## Overview

Issues in Linear are assigned to a single person at a time, giving teams clear ownership and responsibility. Assignment helps teammates triage, track, and prioritize work.

Users can delegate issues to [agents](https://linear.app/docs/agents-in-linear), allowing the agent to work on an issue while the assigned teammate maintains ownership.

### Assigning issues

To assign an issue, open the issue and use the assignee field in the properties sidebar to choose a teammate or agent. You can also assign directly from cards in board views and issue list views by clicking the assignee avatar, or press `A` when viewing or hovering over an issue to open the assignment menu. 

![Video](https://webassets.linear.app/files/ornj730p/production/6014369daf3b3b4e2af4ac3730ba1d662bfe1447.mp4)

To assign yourself quickly, press `I` while viewing an issue or when hovering in list view. 

You can also open the command menu (`⌘K`) and search for "Assign to..." to make updates via keyboard. For bulk assignment, use multi-select in list or board views by typing `X` when hovering over the issue, and right-click to update the assignee from the bulk action bar.

To remove an assignee, choose "No assignee" from the assignment menu.

#### **Assignment permissions**

* Issues in public teams can be assigned to any workspace member
* Private team issues can only be assigned to members of the private team
* Issues cannot be assigned to suspended users

### Delegating to agents

Delegate work by assigning an issue to an agent. You remain the primary assignee and the agent is added as an additional contributor working on your behalf. 

![Video](https://webassets.linear.app/files/ornj730p/production/d70de1f2bd12bbe82afe32f2d6dc06bcacb02731.mp4)

You can change the agent at any time or remove them by selecting "No agent" from the assignment menu. 

To delegate an issue to an agent, make sure the agent has access to the team the issue belongs to. Team membership is set when the agent integration is added to a workspace and can be changed by an admin at any time.

### Managing assigned issues

#### User views

Assigned issues, even those delegated to an agent, appear in your [My Issues](https://linear.app/docs/my-issues) default view, where you can review all issues you're responsible for across your workspace. This view updates automatically based on assignment changes to track the progress of your assigned and delegated work. 

Assigned and delegated issues also appear in any [custom views](https://linear.app/docs/custom-views) filtered by _Assignee_ or _Agent_. 



![Linear custom view titled 'Delegated issues' showing a filtered list of issues. Each issue displays both the assigned teammate and the delegated agent as separate avatars.](https://webassets.linear.app/images/ornj730p/production/d8227db82d75b51c911aa00d759ad527aecb0d82-2364x728.png?q=95&auto=format&dpr=2)

#### History

When viewing issues, the assignment and delegation history is tracked in its Activity feed, which shows changes over time and who made them.

#### Inbox

You are automatically subscribed to issues that are assigned to you. You will be notified of any updates to your assigned issues in your [Inbox](https://linear.app/docs/inbox). You can filter Inbox activity by assignment using the "Notification type" filter to focus on issues that have been assigned to you. 

#### Search

You can filter your searches by assignee or by the agent they've been delegated to through [Search](https://linear.app/docs/search) to locate relevant issues based on ownership or automation. 

#### Insights

[Insights](https://linear.app/docs/insights) surface trends in how work is distributed across assigned teammates and agents. You can report on issues by assignee or by the agent they’ve been delegated to, helping teams understand ownership patterns and automation coverage.

> [!NOTE]
> Available to workspaces on our [Business](https://linear.app/pricing) and [Enterprise](https://linear.app/pricing) plans.

### Automation

Linear supports automated issue assignment that helps teams route and manage issues with minimal input.

Optionally enable an automation to automatically assign yourself to issues you create. To set up this automation, refer to [Preferences](https://linear.app/docs/account-preferences). If you choose not to enable this setting, you can still use the Create more button in an issue draft or press `⌘` + `Shift` + `Enter` when submitting an issue to quickly create another with the same assignee. 

Linear doesn’t currently support auto-assigning issues to a specific teammate by default, but you can use templates to pre-fill the assignee field.

![Settings in preferences to optionally auto-assign yourself when creating new issues.](https://webassets.linear.app/images/ornj730p/production/4fc5803c93a3b6f9aecb4a7ddef902866ecf29dc-1524x298.png?q=95&auto=format&dpr=2)

When a teammate creates a Git branch from an issue, it can automatically assign the issue to them and move it to a started status when you copy the git branch name. This is configurable in [Preferences](https://linear.app/docs/account-preferences). 

![Git-based automations include moving an issue to a started status when copying the Git branch name, and assigning the issue to yourself when moving it to started.](https://webassets.linear.app/images/ornj730p/production/50ce3460e0ae8bbc63f72473fda8908c8844a7aa-1564x762.png?q=95&auto=format&dpr=2)

For custom rules to assign issues when they enter Triage, you can configure [triage rules](https://linear.app/docs/triage#triage-rules) Based on issue properties like team, status, or label, these rules route issues to a specific team and set an assignee. Rules can also delegate issues to an agent as part of the same flow for even greater automation during triage.

> [!NOTE]
> Triage rules are available on our Business and Enterprise plans.

![Linear’s triage settings showing automated assignment and delegation setup. 'Triage responsibility' assigns new issues in triage to a specified teammate. Below, a 'Triage rule' is configured to delegate issues to an agent when assigned to that teammate.](https://webassets.linear.app/images/ornj730p/production/03af13eeca75035924fd384d380cf9827b8ceeb3-1532x1304.png?q=95&auto=format&dpr=2)

### Open issues in coding tools

Open issues in your coding tool of choice with a click. All the issue's data, as well a custom prompt, help your tool start work with the right context.

Enable one or more coding tools like Cursor, Claude Code*, or Codex in [_Settings > Preferences_](https://linear.app/settings/account/preferences) and optionally add a custom prompt. Once configured, open the _Work on issue_ menu to select between your tools by pressing `W` then `O`, or open the issue in your last used tool by clicking on the button, by using the `Cmd` `Option` `.` or `Ctrl` `Alt` `.` keyboard shortcuts.

If you’d like to open issues in other tools with local scripts, please read more [here](https://linear.app/docs/open-issues-with-custom-scripts).

_*For terminal based tools, please use the [desktop app](https://linear.app/download) and refer to the configuration sets in our [FAQ](https://linear.app/docs/assigning-issues#collapsible-914243845565)_. 

### Share issues from private teams

> [!NOTE]
> Private issue sharing is available on the Enterprise plans

You can share individual issues from private teams with specific users outside of the team. This is especially useful when bringing collaborators on to solve individual problems for highly sensitive teams, like security or HR. You can assign them a specific issue from your team without giving them access to the rest of the team's data.

Shared issues will have a banner prominently displayed to indicate who that issue is visible to.  
  
To share an issue, choose “Share issue” from the … menu, or hit `CMD/CTRL K` and type “Share issue”.



## FAQ

<details>
<summary>Open issues in your preferred terminal on macOS desktop</summary>
On MacOS desktop, you can choose your preferred terminal:

![Select between system default, ghostty, warp, and iTerm on the custom script selector in preferences](https://webassets.linear.app/images/ornj730p/production/397bf2abef355881e9f9b648fab6f3cad7dab8a0-1818x646.png?q=95&auto=format&dpr=2)



If you want to change your System default option, here’s how to do so. These examples use iTerm, but you can replace it with any terminal app.



**Option 1: Via Finder (GUI)**  
  
1. Right-click any .command file in Finder  
2. Select Get Info (or press Cmd+I)  
3. Under Open with, select iTerm.app   
4. Click Change All... to apply to all .command files  
  
**Option 2: Using duti (CLI, scriptable)**  
  
Install and use duti to set it programmatically:  
  
`brew install duti  
duti -s com.googlecode.iterm2 .command all`  
  
This is great for dotfiles since you can add it to your setup script.  
  
**Option 3: Using defaults (CLI, no extra tools)**  
  
`defaults write com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -array-add \  
'{LSHandlerContentType="public.command-script"; LSHandlerRoleAll="com.googlecode.iterm2";}`
</details>
