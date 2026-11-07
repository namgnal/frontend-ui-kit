// Reworked from open-claude-ui (MIT): await copy, report failure, clean timers; preserve whitespace.
'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
export interface CodeBlockProps {
  code: string;
  label?: string;
  copy?: (text: string) => Promise<void>;
  messages?: { copy: string; pending: string; success: string; error: string };
}
export function CodeBlock({ code, label = '代码', copy = text => navigator.clipboard.writeText(text),
  messages = { copy: '复制代码', pending: '正在复制', success: '已复制', error: '复制失败，请选择代码手动复制' },
}: CodeBlockProps) {
  const [state, setState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const mounted = useRef(false);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  async function handleCopy() {
    if (pending.current) return;
    pending.current = true;
    clearTimeout(timer.current);
    setState('pending');
    try {
      await copy(code);
      if (mounted.current) {
        setState('success');
        timer.current = setTimeout(() => setState('idle'), 2000);
      }
    } catch { if (mounted.current) setState('error'); }
    finally { pending.current = false; }
  }
  const feedback = state === 'idle' ? '' : messages[state];
  return <figure className="fui-code">
    <figcaption><span>{label}</span><Button busy={state === 'pending'} variant="quiet" onClick={handleCopy}>
      {state === 'success' ? messages.success : messages.copy}</Button></figcaption>
    <pre tabIndex={0} aria-label={label}><code>{code}</code></pre>
    <span className={state === 'error' ? 'fui-code-error' : 'fui-sr-only'} role="status">{feedback}</span>
  </figure>;
}
