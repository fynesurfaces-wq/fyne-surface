'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bell, ChevronDown, LogOut, Menu, PackageCheck, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigation } from '@/lib/queries';
import { useClickOutside } from '@/lib/hooks';
import { RoleBadge } from '@/components/ui/Badge';
import { cn, initials } from '@/lib/utils';
import { P, ROLE_LABEL } from '@/lib/access';
import { GlobalSearch } from './GlobalSearch';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-ink-soft hover:bg-muted lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 justify-center lg:justify-start">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function Dropdown({ trigger, children, label }: { trigger: (open: boolean) => React.ReactNode; children: (close: () => void) => React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={label} className="rounded-xl focus-visible:outline-none focus-visible:shadow-ring">
        {trigger(open)}
      </button>
      {open && <div role="menu" className="absolute right-0 z-40 mt-2 w-72 animate-scale-in rounded-xl border border-border bg-white shadow-pop">{children(close)}</div>}
    </div>
  );
}

function NotificationBell() {
  const { can } = useAuth();
  const { data } = useNavigation();
  const b = data?.badges || {};
  const items = [
    can(P.ORDERS_READ) && b.ordersToFulfill
      ? { icon: PackageCheck, tone: 'green', text: `${b.ordersToFulfill} order${b.ordersToFulfill > 1 ? 's' : ''} ready to fulfil`, href: '/dashboard/orders?orderStatus=Pending' }
      : null,
    can(P.PRODUCTS_READ) && b.lowStock
      ? { icon: AlertTriangle, tone: 'orange', text: `${b.lowStock} product${b.lowStock > 1 ? 's' : ''} low on stock`, href: '/dashboard/products?stockStatus=low_stock' }
      : null,
  ].filter(Boolean) as { icon: typeof Bell; tone: string; text: string; href: string }[];

  return (
    <Dropdown
      label="Notifications"
      trigger={() => (
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-muted">
          <Bell className="h-5 w-5" />
          {items.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-white" />}
        </span>
      )}
    >
      {(close) => (
        <div>
          <p className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">Notifications</p>
          {items.length ? (
            <ul className="p-1.5">
              {items.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-muted">
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', n.tone === 'orange' ? 'bg-secondary-50 text-secondary' : 'bg-primary-50 text-primary')}>
                      <n.icon className="h-4 w-4" />
                    </span>
                    {n.text}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up 🌿</p>
          )}
        </div>
      )}
    </Dropdown>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  return (
    <Dropdown
      label="Account menu"
      trigger={(open) => (
        <span className={cn('flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-muted', open && 'bg-muted')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{initials(user.name)}</span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-[140px] truncate text-sm font-medium text-ink">{user.name}</span>
            <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </span>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <UserCircle2 className="h-9 w-9 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-1.5"><RoleBadge role={user.role} /></div>
            </div>
          </div>
          <div className="p-1.5">
            <button
              role="menuitem"
              disabled={busy}
              onClick={async () => { setBusy(true); await logout(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> {busy ? 'Signing out…' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}
