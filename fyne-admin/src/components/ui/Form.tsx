'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-lg border border-border bg-white px-3 text-sm text-ink placeholder:text-muted-foreground transition ' +
  'focus:border-primary focus:outline-none focus:shadow-ring disabled:cursor-not-allowed disabled:bg-muted';
const invalid = 'border-danger focus:border-danger focus:shadow-[0_0_0_4px_rgba(220,38,38,0.12)]';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid: isInvalid, leftIcon, rightAddon, ...props }, ref) => (
  <div className="relative flex items-center">
    {leftIcon && <span className="pointer-events-none absolute left-3 text-muted-foreground">{leftIcon}</span>}
    <input ref={ref} className={cn(base, 'h-9', leftIcon && 'pl-9', rightAddon && 'pr-12', isInvalid && invalid, className)} {...props} />
    {rightAddon && <span className="absolute right-3 text-xs text-muted-foreground">{rightAddon}</span>}
  </div>
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid: isInvalid, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'min-h-[88px] py-2 leading-relaxed', isInvalid && invalid, className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; containerClassName?: string }>(
  ({ className, containerClassName, invalid: isInvalid, children, ...props }, ref) => (
    <div className={cn('relative', containerClassName)}>
      <select ref={ref} className={cn(base, 'h-9 appearance-none pr-9', isInvalid && invalid, className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
Select.displayName = 'Select';

/** Label + control + hint/error, with consistent spacing. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
  counter,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  counter?: { value: number; max: number };
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
              {label}
              {required && <span className="ml-0.5 text-danger">*</span>}
            </label>
          )}
          {counter && (
            <span className={cn('text-xs tabular-nums', counter.value > counter.max ? 'text-danger' : 'text-muted-foreground')}>
              {counter.value}/{counter.max}
            </span>
          )}
        </div>
      )}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-ink-soft">{label}</span>}
          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-ring',
          checked ? 'bg-primary' : 'bg-gray-300'
        )}
      >
        <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}
