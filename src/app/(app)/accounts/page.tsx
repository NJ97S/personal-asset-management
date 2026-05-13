import Link from "next/link";
import { Plus } from "lucide-react";
import { TopNav } from "@/components/nav/top-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { CategoryIcon } from "@/components/domain/category-icon";
import { MetricCard } from "@/components/domain/metric-card";
import { getSession } from "@/lib/auth";
import { computeNetWorth, isLiabilityAccount } from "@/lib/queries/balances";
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
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { assets, liabilities, netWorth, accounts } = await computeNetWorth(
    session.user.id
  );
  const active = accounts.filter((a) => !a.isArchived);

  return (
    <>
      <TopNav
        title="자산"
        right={
          <Button size="sm" asChild>
            <Link href="/settings/accounts">
              <Plus className="h-4 w-4" /> 계정
            </Link>
          </Button>
        }
      />
      <div className="space-y-3 p-4">
        {accounts.length === 0 ? (
          <Card>
            <EmptyState
              title="등록한 계정이 없어요"
              description="현금, 은행, 증권 계정을 추가하면 자산 추이가 보여요."
              action={
                <Button asChild>
                  <Link href="/settings/accounts">계정 추가</Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <Card className="space-y-1">
              <p className="text-body-s text-muted-foreground">순자산</p>
              <p className="tabular text-display-l">{formatKRW(netWorth)}</p>
              <p className="text-body-s text-muted-foreground">
                자산 {formatKRW(assets)} − 부채 {formatKRW(liabilities)}
              </p>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard label="자산" amount={assets} tone="success" />
              <MetricCard label="부채" amount={liabilities} tone="danger" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {active.map((a) => {
                const liability = isLiabilityAccount(a.type);
                const displayBalance = liability
                  ? Math.max(0, -a.balance)
                  : a.balance;
                return (
                  <Link
                    href={`/accounts/${a.id}`}
                    key={a.id}
                    className="block transition-colors hover:bg-muted/30 rounded-lg"
                  >
                    <Card className="flex items-center gap-3">
                      <CategoryIcon
                        icon={accountIconMap[a.type] ?? "Wallet"}
                        color={a.color}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-body-s text-muted-foreground">
                          {accountLabelMap[a.type] ?? a.type}
                          {liability ? " · 부채" : ""}
                        </div>
                        <div className="truncate text-heading-s">{a.name}</div>
                      </div>
                      <div
                        className={
                          "tabular text-amount-m " +
                          (liability ? "text-danger" : "text-foreground")
                        }
                      >
                        {liability ? "-" : ""}
                        {formatKRW(displayBalance)}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
