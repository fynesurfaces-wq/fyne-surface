export default function Loading() {
  return (
    <div className="container pb-24 pt-10" aria-busy="true" aria-label="Loading product">
      <div className="h-4 w-48 animate-pulse rounded bg-canvas" />
      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-canvas lg:col-span-7" />
        <div className="space-y-5 lg:col-span-5">
          <div className="h-3 w-24 animate-pulse rounded bg-canvas" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-canvas" />
          <div className="h-8 w-40 animate-pulse rounded bg-canvas" />
          <div className="h-24 animate-pulse rounded-2xl bg-canvas" />
          <div className="h-12 animate-pulse rounded-full bg-canvas" />
        </div>
      </div>
    </div>
  );
}
