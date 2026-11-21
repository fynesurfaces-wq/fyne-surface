'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Locks body scroll, closes on Escape, restores focus on close. */
function useOverlay(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const panel = panelRef.current;
      const el =
        panel?.querySelector<HTMLElement>('[data-autofocus]') ||
        panel?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), select, textarea') ||
        panel?.querySelector<HTMLElement>('button:not([data-close])');
      (el || panel)?.focus({ preventScroll: true });
    }, 30);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Centered dialog for create/edit forms. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: OverlayProps & { size?: keyof typeof SIZES }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-2xl bg-white shadow-pop outline-none sm:rounded-2xl',
          SIZES[size],
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button data-close onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-border bg-gray-50/60 px-6 py-3 sm:rounded-b-2xl">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

/** Right-side drawer for detail views (e.g. an order). */
export function Drawer({ open, onClose, title, description, children, footer, className }: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-gray-900/30" onClick={onClose} aria-hidden />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('absolute inset-y-0 right-0 flex w-full max-w-xl animate-slide-in-right flex-col bg-white shadow-pop outline-none', className)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
            {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
          </div>
          <button data-close onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}
