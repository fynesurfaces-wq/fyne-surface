'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, FolderTree, LayoutDashboard, Package, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { P } from '@/lib/access';
import { useNavigation } from '@/lib/queries';
import { Logo } from './Logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  badge?: 'ordersToFulfill' | 'lowStock';
  badgeTone?: 'orange' | 'green';
}

const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: P.DASHBOARD },
      { href: '/dashboard/products', label: 'Products', icon: Package, permission: P.PRODUCTS_READ, badge: 'lowStock', badgeTone: 'orange' },
      { href: '/dashboard/collections', label: 'Collections', icon: FolderTree, permission: P.COLLECTIONS_READ },
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag, permission: P.ORDERS_READ, badge: 'ordersToFulfill', badgeTone: 'green' },
    ],
  },
  {
    title: 'Administration',
    items: [{ href: '/dashboard/users', label: 'User Management', icon: ShieldCheck, permission: P.USERS_MANAGE }],
  },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { can } = useAuth();
  const { data: nav } = useNavigation();

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/dashboard" className="rounded-md focus-visible:outline-none focus-visible:shadow-ring" onClick={onClose}>
          <Logo />
        </Link>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
        {NAV.map((section, i) => {
          const items = section.items.filter((item) => can(item.permission)); // role-based visibility
          if (!items.length) return null;
          return (
            <div key={i}>
              {section.title && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = isActive(item.href);
                  const count = item.badge ? nav?.badges?.[item.badge] : undefined;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-primary-50 text-primary-700' : 'text-ink-soft hover:bg-muted hover:text-ink'
                        )}
                      >
                        {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" />}
                        <item.icon className={cn('h-[18px] w-[18px]', active ? 'text-primary' : 'text-muted-foreground group-hover:text-ink-soft')} />
                        <span className="flex-1">{item.label}</span>
                        {!!count && (
                          <span
                            className={cn(
                              'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums',
                              item.badgeTone === 'orange' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary text-white'
                            )}
                            title={item.badge === 'lowStock' ? 'Low-stock products' : 'Orders to fulfil'}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {nav?.store?.storefrontUrl && (
        <div className="border-t border-border p-3">
          <a
            href={nav.store.storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-muted"
          >
            <ExternalLink className="h-[18px] w-[18px] text-muted-foreground" />
            View storefront
          </a>
          <p className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">Natural spaces. Better living.</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">{content}</aside>
      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-gray-900/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-surface shadow-pop">{content}</aside>
        </div>
      )}
    </>
  );
}
