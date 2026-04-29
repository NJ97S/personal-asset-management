import { TopNav } from "@/components/nav/top-nav";
import { CategoryManager } from "@/components/forms/category-manager";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CategoriesSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const rows = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, session.user.id))
    .orderBy(schema.categories.sortOrder);

  return (
    <>
      <TopNav title="카테고리" back="/settings" />
      <div className="p-4">
        <CategoryManager
          categories={rows.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            kind: c.kind,
            sortOrder: c.sortOrder,
            isArchived: c.isArchived,
          }))}
        />
      </div>
    </>
  );
}
