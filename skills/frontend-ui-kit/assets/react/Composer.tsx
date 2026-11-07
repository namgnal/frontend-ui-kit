// Reworked from open-claude-ui (MIT): IME-safe submit, real callback, async failure and draft preservation.
'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from './Button';
export interface ComposerProps {
  onSend: (text: string) => void | Promise<void>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string;
  messages?: { send: string; pending: string; error: string; hint: string; unsent?: string; recover?: string };
}
export function Composer({ onSend, label = '消息', placeholder = '写下你的想法…', disabled = false,
  defaultValue = '', messages = { send: '发送', pending: '发送中', error: '发送失败，内容已保留，请重试', hint: 'Enter 发送 · Shift + Enter 换行' },
}: ComposerProps) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const compositionEndedAt = useRef(-Infinity);
  const locked = useRef(false);
  const mounted = useRef(false);
  const revision = useRef(0);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const el = area.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 192)}px`; }
  }, [value]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled || locked.current || composing.current || failedDraft !== null || !value.trim()) return;
    const sentRevision = revision.current;
    locked.current = true; setBusy(true); setError(false);
    try {
      await onSend(value);
      if (mounted.current && revision.current === sentRevision) setValue('');
    } catch {
      if (mounted.current) {
        setError(true);
        // Keep the rejected payload separately if the user has already written another draft.
        if (revision.current !== sentRevision) setFailedDraft(value);
      }
    }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return <form className="fui-composer" onSubmit={submit} aria-label={label}>
    <label className="fui-sr-only" htmlFor={id}>{label}</label>
    <textarea ref={area} id={id} value={value} disabled={disabled} rows={2} placeholder={placeholder}
      aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} aria-invalid={error || undefined}
      onChange={e => { revision.current++; setValue(e.target.value); setError(false); }}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={() => { composing.current = false; compositionEndedAt.current = performance.now(); }}
      onKeyDown={e => {
        if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
        if (composing.current || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229 ||
          performance.now() - compositionEndedAt.current < 50) return;
        e.preventDefault(); e.currentTarget.form?.requestSubmit();
      }} />
    <div className="fui-composer-footer"><span className="fui-muted" id={`${id}-hint`}>{messages.hint}</span>
      <Button type="submit" variant="primary" busy={busy} disabled={disabled || failedDraft !== null || !value.trim()}>{busy ? messages.pending : messages.send}</Button></div>
    {error && <p className="fui-error" id={`${id}-error`} role="alert">{messages.error}</p>}
    {failedDraft !== null && <div className="fui-recovery">
      <p>{messages.unsent ?? '上次未发送的内容（放回后可编辑或删除）：'}</p><blockquote>{failedDraft}</blockquote>
      <Button onClick={() => {
        revision.current++;
        setValue(current => current ? `${current}\n${failedDraft}` : failedDraft);
        setFailedDraft(null); setError(false); area.current?.focus();
      }}>{messages.recover ?? '放回输入框'}</Button>
    </div>}
  </form>;
}
