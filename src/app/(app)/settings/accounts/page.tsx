import { TopNav } from "@/components/nav/top-nav";
import { AccountManager } from "@/components/forms/account-manager";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AccountsSettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const rows = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, session.user.id))
    .orderBy(schema.accounts.sortOrder);

  return (
    <>
      <TopNav title="계정" back="/settings" />
      <div className="p-4">
        <AccountManager
          accounts={rows.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currency: a.currency,
            initialBalance: a.initialBalance,
            color: a.color,
            sortOrder: a.sortOrder,
            isArchived: a.isArchived,
          }))}
        />
      </div>
    </>
  );
}
