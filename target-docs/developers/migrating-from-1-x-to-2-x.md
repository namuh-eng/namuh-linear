<!-- Source: https://linear.app/developers/migrating-from-1-x-to-2-x -->

# Migrating from 1.x to 2.x

Version 2 of the SDK introduces a new naming pattern for mutations. The action verb (create, update, delete, archive) should now precede the name of the model being mutated. In order to migrate from version 1.x of the SDK, all mutations usages need to be renamed. Here is an example with the mutation to update a `User`.

### Version 1.x

```ts
const me = await linearClient.viewer;
if (me.id) {
  await linearClient.userUpdate(me.id, { displayName: "Alice" });
}
```

### Version 2.x

```ts
const me = await linearClient.viewer;
if (me.id) {
  await linearClient.updateUser(me.id, { displayName: "Alice" });
}
```
