// Visual status pattern adapted from open-claude-ui (MIT).
'use client';
import type { ReactNode } from 'react';
export function Status({ state, children, announce = false }: {
  state: 'idle' | 'busy' | 'success' | 'error'; children: ReactNode; announce?: boolean;
}) {
  return <span className={`fui-status fui-status--${state}`} role={announce ? 'status' : undefined}>
    <span className={state === 'busy' ? 'fui-spinner' : 'fui-status-dot'} aria-hidden="true" />{children}
  </span>;
}
