import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { getSession, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const sections = [
  { href: "/settings/categories", label: "카테고리 관리", desc: "지출/수입 카테고리, 색·아이콘" },
  { href: "/settings/accounts", label: "계정 관리", desc: "현금, 은행, 카드, 증권 계정" },
  { href: "/settings/holdings", label: "보유 종목", desc: "주식·크립토 종목 등록" },
  { href: "/settings/data", label: "백업·내보내기", desc: "CSV / JSON 가져오기·내보내기" },
  { href: "/settings/security", label: "비밀번호 변경", desc: "단일 사용자 인증" },
  { href: "/dev/preview", label: "디자인 토큰 미리보기", desc: "컴포넌트 카탈로그" },
];

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <>
      <TopNav title="설정" />
      <div className="space-y-3 p-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-s text-muted-foreground">로그인</p>
              <p className="text-heading-s">{session?.user?.email ?? "-"}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                로그아웃
              </Button>
            </form>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {sections.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href as never}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-body-l font-medium">{s.label}</p>
                    <p className="text-body-s text-muted-foreground">{s.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
