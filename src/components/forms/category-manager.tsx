"use client";

import * as React from "react";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ResponsiveSheet } from "./responsive-sheet";
import { CategoryForm } from "./category-form";
import { archiveCategory } from "@/lib/actions/categories";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  kind: "income" | "expense";
  sortOrder: number;
  isArchived: boolean;
};

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | undefined>();
  const [, startTransition] = useTransition();

  const expense = categories.filter((c) => c.kind === "expense");
  const income = categories.filter((c) => c.kind === "income");

  function startNew() {
    setEditing(undefined);
    setOpen(true);
  }

  function startEdit(c: Category) {
    setEditing(c);
    setOpen(true);
  }

  function toggleArchive(c: Category) {
    startTransition(async () => {
      const result = await archiveCategory(c.id, !c.isArchived);
      if (result.ok) {
        toast.success(c.isArchived ? "다시 사용할게요" : "보관함으로 옮겼어요");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-body-s text-muted-foreground">
          {categories.filter((c) => !c.isArchived).length}개 활성 ·{" "}
          {categories.filter((c) => c.isArchived).length}개 보관
        </p>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </div>

      <Tabs defaultValue="expense">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">지출 · {expense.length}</TabsTrigger>
          <TabsTrigger value="income">수입 · {income.length}</TabsTrigger>
        </TabsList>
        {[
          { key: "expense", list: expense },
          { key: "income", list: income },
        ].map(({ key, list }) => (
          <TabsContent key={key} value={key}>
            <Card className="overflow-hidden p-0">
              {list.length === 0 ? (
                <p className="p-6 text-center text-body-m text-muted-foreground">
                  카테고리가 없어요. 우측 상단 추가 버튼으로 만들어 보세요.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {list.map((c) => (
                    <li
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        c.isArchived && "opacity-50"
                      )}
                    >
                      <CategoryIcon icon={c.icon} color={c.color} size="md" />
                      <div className="flex-1 truncate">
                        <p className="text-body-l font-medium">{c.name}</p>
                        <p className="text-body-s text-muted-foreground">
                          {c.kind === "income" ? "수입" : "지출"}
                          {c.isArchived ? " · 보관됨" : ""}
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => toggleArchive(c)}
                        aria-label={c.isArchived ? "다시 사용" : "보관"}
                      >
                        {c.isArchived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEdit(c)}
                        aria-label="편집"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "카테고리 편집" : "새 카테고리"}
      >
        <CategoryForm
          initial={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  icon: editing.icon,
                  color: editing.color,
                  kind: editing.kind,
                  sortOrder: editing.sortOrder,
                }
              : undefined
          }
          onSuccess={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </div>
  );
}
