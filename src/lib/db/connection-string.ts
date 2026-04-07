const LOCAL_DEV_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/namuh_linear";

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_DEV_DATABASE_URL;
  }

  return "";
}
