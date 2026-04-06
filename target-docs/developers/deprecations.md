<!-- Source: https://linear.app/developers/deprecations -->

# Deprecations

Linear's GraphQL API doesn’t have versioning like many REST APIs due to the more constantly evolving nature of GraphQL.

As the product evolves, we need to evolve the API as well, but we take breaking changes and deprecations seriously as we know developers build applications and integrations for the API. If there's a noticeable breaking change in the API, we'll proactively reach out to developers that use that part of the API and give you plenty of time to make changes. In other cases some functionality will be removed and a non-functioning stub will be left in the API to prevent breakage in queries and mutations.

We utilize the `@deprecated` directive to annotate deprecation warnings in the schema. In addition, changes to the API are listed with `[API]` prefix in the [Linear changelog](https://linear.app/changelog).
