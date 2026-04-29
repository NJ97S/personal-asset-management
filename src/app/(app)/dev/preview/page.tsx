import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ListItem } from "@/components/domain/list-item";
import { CategoryIcon } from "@/components/domain/category-icon";
import { AmountDisplay } from "@/components/domain/amount-display";
import { EmptyState } from "@/components/domain/empty-state";
import { MetricCard } from "@/components/domain/metric-card";
import { DateGroupHeader } from "@/components/domain/date-group-header";

export default function DevPreviewPage() {
  return (
    <>
      <TopNav title="디자인 토큰 미리보기" back="/settings" />
      <div className="space-y-6 p-4">
        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">컬러</h2>
          <Card className="grid grid-cols-5 gap-3 p-4">
            {[
              ["primary", "bg-primary"],
              ["brand-blue", "bg-brand-blue"],
              ["brand-cyan", "bg-brand-cyan"],
              ["brand-pink", "bg-brand-pink"],
              ["danger", "bg-danger"],
            ].map(([name, cls]) => (
              <div key={name} className="space-y-1.5 text-center">
                <div className={`h-12 w-full rounded-md ${cls}`} />
                <span className="text-caption text-muted-foreground">{name}</span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">타이포</h2>
          <Card className="space-y-2">
            <p className="text-display-xl tabular">₩12,345,000</p>
            <p className="text-display-l">이번 달 지출</p>
            <p className="text-heading-l">최근 거래</p>
            <p className="text-heading-m">카드 헤더</p>
            <p className="text-heading-s">4월 28일</p>
            <p className="text-body-l">본문 16px</p>
            <p className="text-body-m text-muted-foreground">보조 14px</p>
            <p className="text-body-s text-muted-foreground">메모 13px</p>
            <p className="text-caption text-muted-foreground">캡션 12px</p>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">버튼</h2>
          <Card className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">폼</h2>
          <Card className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="prev-input">이메일</Label>
              <Input id="prev-input" placeholder="you@example.com" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prev-switch">다크 모드</Label>
              <Switch id="prev-switch" />
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">배지/뱃지</h2>
          <Card className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="primary">primary</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="danger">danger</Badge>
            <Badge variant="info">info</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="outline">outline</Badge>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">메트릭/금액</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <MetricCard
              label="이번 달 지출"
              amount={1234500}
              previous={1100000}
              tone="danger"
              size="l"
            />
            <MetricCard
              label="순자산"
              amount={45120000}
              previous={43500000}
              tone="success"
              hint="이전 달 대비"
              size="l"
            />
          </div>
          <Card className="mt-3 flex items-center gap-4">
            <AmountDisplay amount={12500} variant="income" />
            <AmountDisplay amount={32400} variant="expense" />
            <AmountDisplay amount={50000} variant="neutral" />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">아이콘</h2>
          <Card className="flex flex-wrap items-center gap-3">
            <CategoryIcon icon="Utensils" color="hsl(var(--brand-green))" size="md" />
            <CategoryIcon icon="Car" color="hsl(var(--brand-blue))" size="md" />
            <CategoryIcon icon="Home" color="hsl(var(--brand-pink))" size="md" />
            <CategoryIcon icon="ShoppingBag" color="hsl(var(--brand-amber))" size="md" />
            <CategoryIcon icon="Coffee" color="hsl(var(--brand-cyan))" size="md" rounded="full" />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">거래 항목</h2>
          <Card className="overflow-hidden p-0">
            <DateGroupHeader date={new Date()} income={50000} expense={32400} sticky={false} />
            <Separator />
            <ListItem
              icon={{ name: "Utensils", color: "hsl(var(--brand-green))" }}
              title="스타벅스"
              subtitle="식비 · 카드"
              amount={6500}
              amountVariant="expense"
              meta="14:32"
            />
            <Separator />
            <ListItem
              icon={{ name: "Briefcase", color: "hsl(var(--brand-blue))" }}
              title="4월 급여"
              subtitle="수입"
              amount={3200000}
              amountVariant="income"
              meta="09:00"
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">스켈레톤</h2>
          <Card className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-heading-s text-muted-foreground">빈 상태</h2>
          <Card>
            <EmptyState
              title="아직 기록이 없어요"
              description="첫 거래를 추가해 볼까요?"
              action={<Button>거래 추가</Button>}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
