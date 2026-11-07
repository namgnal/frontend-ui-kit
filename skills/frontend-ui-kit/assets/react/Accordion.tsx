// Reworked from ThinkingAccordion (MIT): native disclosure supports keyboard and avoids hidden focus targets.
'use client';
import type { ReactNode } from 'react';
export function Accordion({ title, children, defaultOpen = false }: {
  title: string; children: ReactNode; defaultOpen?: boolean;
}) {
  return <details className="fui-accordion" open={defaultOpen || undefined}>
    <summary>{title}<span className="fui-chevron" aria-hidden="true">⌄</span></summary>
    <div className="fui-accordion-content">{children}</div>
  </details>;
}
