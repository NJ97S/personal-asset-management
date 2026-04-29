import Link from "next/link";
import { Plus } from "lucide-react";
import { TopNav } from "@/components/nav/top-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { CategoryIcon } from "@/components/domain/category-icon";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { formatKRW } from "@/lib/utils";

export const dynamic = "force-dynamic";

const accountIconMap: Record<string, string> = {
  cash: "Wallet",
  bank: "Landmark",
  credit_card: "CreditCard",
  stock: "TrendingUp",
  crypto: "Bitcoin",
  real_estate: "Building2",
  loan: "HandCoins",
  other: "Coins",
};

const accountLabelMap: Record<string, string> = {
  cash: "현금",
  bank: "은행",
  credit_card: "카드",
  stock: "증권",
  crypto: "암호화폐",
  real_estate: "부동산",
  loan: "대출",
  other: "기타",
};

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const accountsRows = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, session.user.id));

  return (
    <>
      <TopNav
        title="자산"
        right={
          <Button size="sm" asChild>
            <Link href={"/settings/accounts/new" as never}>
              <Plus className="h-4 w-4" /> 계정
            </Link>
          </Button>
        }
      />
      <div className="space-y-3 p-4">
        {accountsRows.length === 0 ? (
          <Card>
            <EmptyState
              title="등록한 계정이 없어요"
              description="현금, 은행, 증권 계정을 추가하면 자산 추이가 보여요."
              action={
                <Button asChild>
                  <Link href={"/settings/accounts/new" as never}>
                    계정 추가
                  </Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {accountsRows.map((a) => (
              <Card
                key={a.id}
                className="flex items-center gap-3 transition-colors hover:bg-muted/30"
              >
                <CategoryIcon
                  icon={accountIconMap[a.type] ?? "Wallet"}
                  color={a.color}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-body-s text-muted-foreground">
                    {accountLabelMap[a.type] ?? a.type}
                  </div>
                  <div className="truncate text-heading-s">{a.name}</div>
                </div>
                <div className="tabular text-amount-m">
                  {formatKRW(a.initialBalance)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
