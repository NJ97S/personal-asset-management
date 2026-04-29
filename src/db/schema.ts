import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/**
 * Single-user system. Most rows still carry user_id so we can later
 * migrate to a multi-tenant store without a schema rewrite.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts_auth = sqliteTable(
  "accounts_auth",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

/* ------- Domain ------- */

export const accountTypeEnum = [
  "cash",
  "bank",
  "credit_card",
  "stock",
  "crypto",
  "real_estate",
  "loan",
  "other",
] as const;
export type AccountType = (typeof accountTypeEnum)[number];

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: accountTypeEnum }).notNull(),
    currency: text("currency").notNull().default("KRW"),
    initialBalance: real("initial_balance").notNull().default(0),
    icon: text("icon"),
    color: text("color"),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index("accounts_user_idx").on(t.userId),
  })
);
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export const categoryKindEnum = ["income", "expense"] as const;
export type CategoryKind = (typeof categoryKindEnum)[number];

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    name: text("name").notNull(),
    icon: text("icon"),
    color: text("color"),
    kind: text("kind", { enum: categoryKindEnum }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index("categories_user_idx").on(t.userId),
    kindIdx: index("categories_kind_idx").on(t.kind),
  })
);
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const txTypeEnum = [
  "income",
  "expense",
  "transfer",
  "trade",
] as const;
export type TxType = (typeof txTypeEnum)[number];

export const tradeKindEnum = ["buy", "sell"] as const;
export type TradeKind = (typeof tradeKindEnum)[number];

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    type: text("type", { enum: txTypeEnum }).notNull(),

    accountId: text("account_id"),
    categoryId: text("category_id"),

    fromAccountId: text("from_account_id"),
    toAccountId: text("to_account_id"),

    tradeKind: text("trade_kind", { enum: tradeKindEnum }),
    ticker: text("ticker"),
    quantity: real("quantity"),
    pricePerUnit: real("price_per_unit"),
    fee: real("fee"),

    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("KRW"),
    payee: text("payee"),
    memo: text("memo"),
    tags: text("tags"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index("tx_user_idx").on(t.userId),
    occurredIdx: index("tx_occurred_idx").on(t.occurredAt),
    accountIdx: index("tx_account_idx").on(t.accountId),
    fromIdx: index("tx_from_idx").on(t.fromAccountId),
    toIdx: index("tx_to_idx").on(t.toAccountId),
    categoryIdx: index("tx_category_idx").on(t.categoryId),
    typeIdx: index("tx_type_idx").on(t.type),
  })
);
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const assetClassEnum = [
  "stock_kr",
  "stock_us",
  "etf",
  "fund",
  "crypto",
  "other",
] as const;
export type AssetClass = (typeof assetClassEnum)[number];

export const holdings = sqliteTable(
  "holdings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    name: text("name"),
    exchange: text("exchange"),
    assetClass: text("asset_class", { enum: assetClassEnum }).notNull(),
    quantity: real("quantity").notNull().default(0),
    avgBuyPrice: real("avg_buy_price").notNull().default(0),
    manualValue: real("manual_value"),
    lastPricedAt: integer("last_priced_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index("holdings_user_idx").on(t.userId),
    accountIdx: index("holdings_account_idx").on(t.accountId),
    tickerIdx: index("holdings_ticker_idx").on(t.ticker),
  })
);
export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;

export const prices = sqliteTable(
  "prices",
  {
    ticker: text("ticker").notNull(),
    date: text("date").notNull(),
    close: real("close").notNull(),
    currency: text("currency").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ticker, t.date] }),
  })
);

export const accountSnapshots = sqliteTable(
  "account_snapshots",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    snapshotDate: text("snapshot_date").notNull(),
    balance: real("balance").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    uniq: uniqueIndex("snapshot_unique").on(t.accountId, t.snapshotDate),
  })
);

export const settings = sqliteTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  baseCurrency: text("base_currency").notNull().default("KRW"),
  timezone: text("timezone").notNull().default("Asia/Seoul"),
  theme: text("theme").notNull().default("system"),
  locale: text("locale").notNull().default("ko-KR"),
  fxRatesUpdatedAt: integer("fx_rates_updated_at", { mode: "timestamp_ms" }),
});
