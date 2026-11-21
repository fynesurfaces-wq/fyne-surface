'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { fallbackRoute, requiredPermission } from '@/lib/access';
import { Logo } from './Logo';

/**
 * Client-side route protection for /dashboard/*.
 *
 * Why not Next.js middleware? The access token lives only in memory, and the
 * refresh cookie is HttpOnly and scoped to /api/v1/auth — so neither is
 * visible to middleware on /dashboard requests (by design: that's what makes
 * them hard to steal). The guard therefore runs after the silent refresh.
 * The API enforces every permission independently, so this is UX, not security.
 *
 *  - not logged in              → /login?next=<path>
 *  - editor on /dashboard/orders → /dashboard/products
 *  - admin on /dashboard/users   → /dashboard
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, role, permissions, can } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const needed = requiredPermission(pathname);
  const allowed = status === 'authenticated' && (!needed || can(needed));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && needed && !can(needed)) {
      const target = fallbackRoute(role, permissions);
      router.replace(target === pathname ? '/login' : target);
    }
  }, [status, needed, can, role, permissions, pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
        <Logo />
        <span className="h-1 w-24 overflow-hidden rounded-full bg-primary-100">
          <span className="block h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </span>
      </div>
    );
  }
  return <>{children}</>;
}
