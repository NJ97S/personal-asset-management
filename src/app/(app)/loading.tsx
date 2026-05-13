import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur safe-top">
        <Skeleton className="h-5 w-24" />
        <div className="ml-auto flex items-center gap-1">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </header>

      <div className="space-y-3 p-4">
        <Card className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-48" />
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-28" />
          </Card>
          <Card className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-28" />
          </Card>
        </div>

        <Card className="space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
