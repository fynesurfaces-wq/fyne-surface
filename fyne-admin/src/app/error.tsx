'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[45vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">We couldn’t load this page.</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">Please try again. If the problem continues, contact support.</p>
      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Try again</button>
    </main>
  );
}
