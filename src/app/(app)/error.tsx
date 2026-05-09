'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium">문제가 발생했어요</p>
      <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
