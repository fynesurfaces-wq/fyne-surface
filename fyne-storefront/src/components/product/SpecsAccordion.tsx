'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpecSection {
  id: string;
  title: string;
  rows: { label: string; value: string }[];
  note?: string;
}

/**
 * Expandable specification groups. Content is ALWAYS in the DOM (collapsed
 * with a CSS grid-rows transition, not unmounted), so search engines and AI
 * crawlers read every spec even when a section is closed.
 */
export function SpecsAccordion({ sections, defaultOpen = [] }: { sections: SpecSection[]; defaultOpen?: string[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="divide-y divide-line border-y border-line">
      {sections.map((s) => {
        const isOpen = open.has(s.id);
        return (
          <section key={s.id} aria-labelledby={`spec-h-${s.id}`}>
            <h3 id={`spec-h-${s.id}`}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                aria-controls={`spec-p-${s.id}`}
                className="flex w-full items-center justify-between py-5 text-left text-[15px] font-semibold text-ink transition-colors hover:text-primary"
              >
                {s.title}
                <Plus className={cn('h-4 w-4 shrink-0 transition-transform duration-500 ease-premium', isOpen && 'rotate-45')} aria-hidden />
              </button>
            </h3>
            <div
              id={`spec-p-${s.id}`}
              className={cn('grid transition-[grid-template-rows] duration-500 ease-premium', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
              <div className="overflow-hidden">
                <dl className="pb-5">
                  {s.rows.map((r) => (
                    <div key={r.label} className="flex items-baseline justify-between gap-6 py-2 text-sm">
                      <dt className="text-ink-muted">{r.label}</dt>
                      <dd className="text-right font-medium text-ink">{r.value}</dd>
                    </div>
                  ))}
                </dl>
                {s.note && <p className="-mt-2 whitespace-pre-line pb-5 text-[13px] leading-relaxed text-ink-muted">{s.note}</p>}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
