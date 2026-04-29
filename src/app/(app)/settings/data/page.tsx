import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileJson } from "lucide-react";

export const dynamic = "force-static";

export default function DataPage() {
  return (
    <>
      <TopNav title="백업·내보내기" back="/settings" />
      <div className="space-y-3 p-4">
        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">CSV 내보내기</h2>
            <p className="text-body-s text-muted-foreground">
              모든 거래를 표 형식으로 내려받아요. Excel·구글 시트·다른 가계부에서 그대로 열려요.
            </p>
          </div>
          <Button asChild className="w-full" variant="secondary">
            <a href="/api/export?format=csv" download>
              <Download className="h-4 w-4" /> CSV 내려받기
            </a>
          </Button>
        </Card>

        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">JSON 내보내기</h2>
            <p className="text-body-s text-muted-foreground">
              계정·카테고리·거래까지 전체 구조로 백업. 서비스를 떠날 때도 데이터는 내 거예요.
            </p>
          </div>
          <Button asChild className="w-full" variant="secondary">
            <a href="/api/export?format=json" download>
              <FileJson className="h-4 w-4" /> JSON 내려받기
            </a>
          </Button>
        </Card>

        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">가져오기</h2>
            <p className="text-body-s text-muted-foreground">
              아직 준비 중이에요. 추후에 동일 포맷의 CSV를 다시 올려서 복원할 수 있어요.
            </p>
          </div>
          <Button disabled className="w-full" variant="ghost">
            준비 중
          </Button>
        </Card>
      </div>
    </>
  );
}
