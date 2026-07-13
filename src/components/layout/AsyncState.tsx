import { Skeleton } from '../ui/skeleton';

/** Shared loading/error/empty presentational states, reused across pages (DRY). */
export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
