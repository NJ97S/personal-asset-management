import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function loadFormDefaults(userId: string) {
  const [allCategories, allAccounts] = await Promise.all([
    db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.userId, userId),
          eq(schema.categories.isArchived, false)
        )
      ),
    db
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, userId),
          eq(schema.accounts.isArchived, false)
        )
      ),
  ]);

  const recent = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, userId))
    .orderBy(desc(schema.transactions.occurredAt))
    .limit(20);

  let lastExpenseCategory: string | undefined;
  let lastIncomeCategory: string | undefined;
  let lastAccount: string | undefined;
  for (const t of recent) {
    if (!lastAccount && t.accountId) lastAccount = t.accountId;
    if (!lastExpenseCategory && t.type === "expense" && t.categoryId)
      lastExpenseCategory = t.categoryId;
    if (!lastIncomeCategory && t.type === "income" && t.categoryId)
      lastIncomeCategory = t.categoryId;
    if (lastExpenseCategory && lastIncomeCategory && lastAccount) break;
  }

  return {
    categories: allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      icon: c.icon,
      color: c.color,
    })),
    accounts: allAccounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
    defaultCategoryIdByKind: {
      expense: lastExpenseCategory,
      income: lastIncomeCategory,
    },
    defaultAccountId: lastAccount,
  };
}
