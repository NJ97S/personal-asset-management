"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Bottom Sheet on mobile (vaul Drawer), centered Dialog on desktop.
 * Same API as Dialog/Drawer (controlled via open + onOpenChange).
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    // grid gap-4 p-6 default 을 flex 컬럼 + no-gap/no-padding 으로 덮는다.
    // 헤더(+absolute X) 는 shrink-0, 본문만 flex-1 overflow-y-auto 로 분리해
    // 본문이 길어져도 헤더/닫기 버튼이 항상 보이고 모달 자체는 잘리지 않게.
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92dvh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 px-6 pb-3 pt-6 text-left">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-1">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 safe-bottom">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
