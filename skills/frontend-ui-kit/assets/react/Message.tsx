// Layout pattern adapted from open-claude-ui (MIT); no provider/model branding or fabricated timing.
'use client';
import { useId, type ReactNode } from 'react';
export function Message({ author, side = 'start', children, meta }: {
  author: string; side?: 'start' | 'end'; children: ReactNode; meta?: ReactNode;
}) {
  const id = useId();
  return <article className={`fui-message fui-message--${side}`} aria-labelledby={id}>
    <div className="fui-message-author" id={id}>{author}</div>
    <div className="fui-message-body">{children}</div>
    {meta && <footer className="fui-muted">{meta}</footer>}
  </article>;
}
