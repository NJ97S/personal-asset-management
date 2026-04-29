import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

async function main() {
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  console.log(`[migrate] applying to ${url}`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
