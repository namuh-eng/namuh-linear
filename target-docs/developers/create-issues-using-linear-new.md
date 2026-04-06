<!-- Source: https://linear.app/developers/create-issues-using-linear-new -->

# Create issues using linear.new

You can open Linear using a link with specific query parameters to start issue creation and pre-fill fields. This is available without needing to integrate with Linear API.

The following links trigger the creation of a new Linear issue in any browser and you can add query parameters after any of them to pre-fill issue fields:

* http://linear.app/new
* http://linear.app/team/<team ID>/new
* http://linear.new

For example, you can assign new issues to a specific person, set an estimate, add labels, or combine multiple parameters with instructions in the description to create a template for a user to fill out.

## Generate a pre-filled link

You can open any issue page in Linear, open command menu using `Cmd/Ctrl + K` and then select _`Copy pre-filled create issue URL to clipboard`_. This will copy the URL to the clipboard, allowing you to quickly create a URL with parameters that will pre-fill the new issue creation state with the same properties set on the issue page.

### Supported parameters

We support the following query parameters.

Parameter | Description | Examples
--- | --- | ---
`title` and `description` | Use to `+` indicate an empty space in the keyword. For example, `?title=My+Title` meaning "My Title". | * `https://linear.new?title=My+issue+title&description=This+is+my+issue+description`
* `https://linear.app/team/LIN/new?title=Issues+with+scrolling+the+modal+window`
`status` | Indicates the initially selected status of the issue.

Can be set by `UUID` or name of the workflow status. When using `UUID` you also need to indicate a corresponding team key. | * `https://linear.new?status=Todo`
* `https://linear.app/team/MOB/new?status=<UUID>`
`priority` | Indicates the initially selected priority of the issue.

Possible values are `high`, `urgent`, `medium` and `low.` | * `https://linear.new?priority=urgent`
* `https://linear.app/team/LIN/new?title=Important+Bug&priority=high`

#### ,  
,
`assignee` | Indicates the initially selected assignee of the issue.

Possible values: `UUID` of the specific user, display name (shortname) or a full name of a user. | * `https://linear.new?assignee=john`
* `https://linear.new?assignee=John+Doe`
* `https://linear.app/team/LIN/new?assignee=<UUID>`
`estimate` | Indicates the initially selected estimate of the issue. Applicable only when the targeted team has estimates feature enabled.

Can be set by their point number e.g. `estimate=4`

T-shirt sizes have the following point values: `No priority (0)`, `XS (1)`, `S(2)`, `M (3)`, `L (5)`, `XL (8)`, `XXL (13)`, `XXXL (21)` | * `https://linear.app/team/LIN/new?estimate=2`
`cycle` | Indicates the initially selected cycle of the issue. Applicable only when the targeted team has cycles feature enabled.

Can be set by `UUID`, cycle number or a name of a cycle. | * `https://linear.app/team/MOB?cycle=36`
* `https://linear.app/team/EU/new?cycle=focus+on+bugs`
* `https://linear.app/team/EU/new?cycle=<UUID>`
`label` or `labels` | Indicates the initially selected labels on the issue. If the label doesn't exist in the workspace, it will be ignored. | * `https://linear.app/team/LIN/new?label=bug`
* `https://linear.new?labels=bug,android,comments`
`project` | Indicates the initially selected project in the issue. Requires `team` to be specified in the URL.

Can be set by `UUID` or the name of the project. | * `https://linear.app/team/LIN/new?project=Project+page+improvements`
* `https://linear.app/team/MOB/new?project=<UUID>`
`projectMilestone` | Indicates the initially selected project milestones in the issue. Requires `team` and `project` to be specified in the URL.

Can be set by `UUID` or the name of the project milestone. | * `https://linear.app/team/LIN/new?project=Project+page+improvements&projectMilestone=Beta`
* `https://linear.app/team/MOB/new?project=<UUID>&projectMilestone=<UUID>`
`template` | Indicates a template that will be used for the issue creation. Issue templates are a powerful tool to set multiple issue properties at once. Also, it's possible to specify sub-issues when using an issue template.

Can be set by `UUID` of the issue template.

You can generate an issue template URL in the app. Go to your team's templates (under team settings), hover over the template you want to use, and then click the "Copy URL" action in the menu. | * `https://linear.app/team/LIN/new?template=<UUID`
