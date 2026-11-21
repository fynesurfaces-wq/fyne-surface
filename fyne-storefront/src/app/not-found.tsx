import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-eyebrow uppercase text-accent">404</p>
      <h1 className="mt-4 text-display-lg text-ink">This page has wandered off.</h1>
      <p className="mt-4 max-w-md text-lg text-ink-muted">The page you’re looking for doesn’t exist or has moved. Our greenery, however, is right where you left it.</p>
      <div className="mt-10 flex gap-3">
        <ButtonLink href="/collections" size="lg">Shop collections</ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">Go home</ButtonLink>
      </div>
    </section>
  );
}
