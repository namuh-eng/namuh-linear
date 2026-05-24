local claims = std.extVar('claims');

{
  identity: {
    traits: {
      email: claims.email,
      name: if std.objectHas(claims, 'name') then claims.name else claims.email,
    },
  },
}
