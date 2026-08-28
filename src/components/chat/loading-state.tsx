import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading chat..." }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="ml-auto h-12 w-1/2" />
      <Skeleton className="h-20 w-3/4" />
    </div>
  );
}
