'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const DISMISS_KEY = 'pwa-install-dismissed-at';
    const TWO_WEEKS = 14 * 24 * 3600 * 1000;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < TWO_WEEKS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed-at', String(Date.now()));
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-background px-4 py-3 shadow-lg ring-1 ring-border">
      <span className="text-sm text-foreground">홈 화면에 추가하시겠어요?</span>
      <Button size="sm" onClick={handleInstall}>
        홈 화면에 추가
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDismiss}>
        닫기
      </Button>
    </div>
  );
}
