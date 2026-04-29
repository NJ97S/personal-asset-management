import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { scryptSync, randomBytes } from "node:crypto";
import * as schema from "../src/db/schema";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("hex")}`;
}

const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const SEED_EMAIL = process.env.SEED_EMAIL ?? "me@asset.local";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "asset-dev-1234";

const defaultCategories = [
  // expense
  { name: "식비", icon: "Utensils", color: "#00CD80", kind: "expense" as const, sortOrder: 1 },
  { name: "교통", icon: "Bus", color: "#0099FF", kind: "expense" as const, sortOrder: 2 },
  { name: "주거", icon: "Home", color: "#F582C6", kind: "expense" as const, sortOrder: 3 },
  { name: "쇼핑", icon: "ShoppingBag", color: "#F79009", kind: "expense" as const, sortOrder: 4 },
  { name: "문화", icon: "Film", color: "#00CDCD", kind: "expense" as const, sortOrder: 5 },
  { name: "의료", icon: "Stethoscope", color: "#F04438", kind: "expense" as const, sortOrder: 6 },
  { name: "통신", icon: "Smartphone", color: "#7E57C2", kind: "expense" as const, sortOrder: 7 },
  { name: "기타지출", icon: "Coins", color: "#9CA3AF", kind: "expense" as const, sortOrder: 99 },
  // income
  { name: "급여", icon: "Briefcase", color: "#00CD80", kind: "income" as const, sortOrder: 1 },
  { name: "보너스", icon: "Sparkles", color: "#0099FF", kind: "income" as const, sortOrder: 2 },
  { name: "이자", icon: "PiggyBank", color: "#F79009", kind: "income" as const, sortOrder: 3 },
  { name: "기타수입", icon: "Coins", color: "#9CA3AF", kind: "income" as const, sortOrder: 99 },
];

const defaultAccounts: Array<{
  name: string;
  type: schema.AccountType;
  initialBalance: number;
  color?: string;
}> = [
  { name: "현금", type: "cash", initialBalance: 0, color: "#00CD80" },
  { name: "주거래 은행", type: "bank", initialBalance: 0, color: "#0099FF" },
  { name: "신용카드", type: "credit_card", initialBalance: 0, color: "#F582C6" },
];

async function main() {
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  console.log(`[seed] connected to ${url}`);

  let user = (
    await db.select().from(schema.users).where(eq(schema.users.email, SEED_EMAIL)).limit(1)
  )[0];

  if (!user) {
    const id = nanoid();
    await db.insert(schema.users).values({
      id,
      email: SEED_EMAIL,
      name: "나",
      passwordHash: hashPassword(SEED_PASSWORD),
    });
    user = (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0];
    console.log(`[seed] created user ${SEED_EMAIL}`);
  } else {
    console.log(`[seed] user ${SEED_EMAIL} already exists, skipping user create`);
  }

  if (!user) throw new Error("user creation failed");

  const existingCats = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id));
  if (existingCats.length === 0) {
    await db.insert(schema.categories).values(
      defaultCategories.map((c) => ({
        id: nanoid(),
        userId: user!.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        kind: c.kind,
        sortOrder: c.sortOrder,
      }))
    );
    console.log(`[seed] inserted ${defaultCategories.length} categories`);
  } else {
    console.log(`[seed] ${existingCats.length} categories already exist`);
  }

  const existingAccs = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, user.id));
  if (existingAccs.length === 0) {
    await db.insert(schema.accounts).values(
      defaultAccounts.map((a, i) => ({
        id: nanoid(),
        userId: user!.id,
        name: a.name,
        type: a.type,
        initialBalance: a.initialBalance,
        color: a.color,
        sortOrder: i,
      }))
    );
    console.log(`[seed] inserted ${defaultAccounts.length} accounts`);
  } else {
    console.log(`[seed] ${existingAccs.length} accounts already exist`);
  }

  const existingSettings = (
    await db.select().from(schema.settings).where(eq(schema.settings.userId, user.id))
  )[0];
  if (!existingSettings) {
    await db.insert(schema.settings).values({ userId: user.id });
    console.log("[seed] settings row created");
  }

  console.log(`\n[seed] DONE`);
  console.log(`  email:    ${SEED_EMAIL}`);
  console.log(`  password: ${SEED_PASSWORD}`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
