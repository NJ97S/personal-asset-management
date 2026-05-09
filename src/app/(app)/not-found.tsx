import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium">페이지를 찾을 수 없어요</p>
      <p className="text-sm text-muted-foreground">요청하신 페이지가 존재하지 않습니다.</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
