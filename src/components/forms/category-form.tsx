"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/domain/category-icon";
import { cn } from "@/lib/utils";
import { upsertCategory } from "@/lib/actions/categories";

const ICON_OPTIONS = [
  "Utensils",
  "Bus",
  "Home",
  "ShoppingBag",
  "Film",
  "Stethoscope",
  "Smartphone",
  "Coffee",
  "Briefcase",
  "Sparkles",
  "PiggyBank",
  "Coins",
  "GraduationCap",
  "Plane",
  "Heart",
  "Gift",
] as const;

const COLOR_OPTIONS = [
  "#00CD80",
  "#0099FF",
  "#00CDCD",
  "#F582C6",
  "#F79009",
  "#F04438",
  "#7E57C2",
  "#9CA3AF",
] as const;

interface CategoryFormProps {
  initial?: {
    id?: string;
    name?: string;
    icon?: string | null;
    color?: string | null;
    kind?: "income" | "expense";
    sortOrder?: number;
  };
  onSuccess?: () => void;
}

export function CategoryForm({ initial, onSuccess }: CategoryFormProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [icon, setIcon] = React.useState<string>(initial?.icon ?? "Tag");
  const [color, setColor] = React.useState<string>(
    initial?.color ?? "#00CD80"
  );
  const [kind, setKind] = React.useState<"income" | "expense">(
    initial?.kind ?? "expense"
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (initial?.id) formData.set("id", initial.id);
    formData.set("name", name);
    formData.set("icon", icon);
    formData.set("color", color);
    formData.set("kind", kind);
    formData.set("sortOrder", String(initial?.sortOrder ?? 0));

    startTransition(async () => {
      const result = await upsertCategory(formData);
      if (result.ok) {
        toast.success(initial?.id ? "수정했어요" : "카테고리를 추가했어요");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">이름</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 카페"
          required
          maxLength={40}
        />
      </div>

      <div className="space-y-1.5">
        <Label>유형</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">지출</SelectItem>
            <SelectItem value="income">수입</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>색</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={c === color}
              className={cn(
                "h-9 w-9 rounded-full transition-transform",
                c === color ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>아이콘</Label>
        <div className="grid grid-cols-8 gap-2">
          {ICON_OPTIONS.map((name) => {
            const active = name === icon;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                aria-label={name}
                aria-pressed={active}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  active ? "ring-2 ring-primary" : "hover:bg-muted/60"
                )}
              >
                <CategoryIcon icon={name} color={color} size="sm" />
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={pending || !name} className="w-full">
        {pending ? "저장하는 중..." : initial?.id ? "수정" : "추가"}
      </Button>
    </form>
  );
}
