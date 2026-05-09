import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-24 w-full" />
    </main>
  );
}
