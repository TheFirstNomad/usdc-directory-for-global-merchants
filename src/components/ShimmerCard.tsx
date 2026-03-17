import { Skeleton } from "@/components/ui/skeleton";

const ShimmerCard = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border">
    <div className="h-24 bg-muted/50 flex items-center justify-center">
      <Skeleton className="h-16 w-16 rounded-xl" />
    </div>
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  </div>
);

export default ShimmerCard;
