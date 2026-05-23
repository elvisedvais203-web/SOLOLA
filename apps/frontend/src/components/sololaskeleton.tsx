export function FeedSkeleton() {
  return (
    <div className="glass animate-pulse rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-3 h-52 w-full rounded-2xl bg-white/10" />
      <div className="mt-3 flex gap-2">
        <div className="h-8 w-16 rounded-full bg-white/10" />
        <div className="h-8 w-16 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function ReelSkeleton() {
  return (
    <div className="glass mb-4 animate-pulse snap-start overflow-hidden rounded-3xl border border-white/10">
      <div className="h-[70vh] w-full bg-white/10" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExploreGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-sm bg-white/10" />
      ))}
    </div>
  );
}
