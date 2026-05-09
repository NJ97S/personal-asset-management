'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground antialiased">
        <p className="text-lg font-medium">심각한 오류가 발생했어요</p>
        <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
        <Button onClick={reset}>다시 시도</Button>
      </body>
    </html>
  );
}
