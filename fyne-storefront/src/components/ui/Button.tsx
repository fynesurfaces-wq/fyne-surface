import Link from 'next/link';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_10px_26px_-12px_rgba(31,85,34,0.75)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(31,85,34,0.58)]',
  accent: 'bg-gradient-to-b from-accent-600 to-accent-700 text-white shadow-[0_10px_26px_-12px_rgba(143,92,18,0.72)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(143,92,18,0.56)]',
  outline: 'border border-ink/15 bg-white/90 text-ink shadow-soft hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-50',
  ghost: 'text-ink hover:bg-ink/5',
  light: 'bg-white text-ink hover:bg-white/90',
  dark: 'bg-ink text-white hover:bg-primary-900',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-7 text-[15px]',
  xl: 'h-14 px-9 text-base',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.005em] transition-all duration-500 ease-premium ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
));
Button.displayName = 'Button';

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children, ...rest }: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}
