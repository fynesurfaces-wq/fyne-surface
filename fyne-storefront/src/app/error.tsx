'use client';

export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container flex min-h-[45vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-eyebrow uppercase text-accent-700">Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">We couldn’t load this page.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">Please try again. If the problem continues, contact our team for help.</p>
      <button type="button" onClick={reset} className="mt-6 min-h-11 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Try again</button>
    </main>
  );
}
