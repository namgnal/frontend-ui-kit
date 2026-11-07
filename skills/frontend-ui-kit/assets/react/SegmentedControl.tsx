// Reworked from open-claude-ui (MIT): radio semantics, wrapping and disabled-item handling.
'use client';
import { useRef, type KeyboardEvent } from 'react';

export interface Segment { value: string; label: string; disabled?: boolean }
export interface SegmentedControlProps {
  label: string;
  options: readonly Segment[];
  value: string;
  onChange: (value: string) => void;
}

/** For mutually exclusive settings/filters. Use a real tabs primitive for tab panels. */
export function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.flatMap((o, i) => o.disabled ? [] : [i]);
  const selected = options.findIndex(o => o.value === value && !o.disabled);
  const tabStop = selected >= 0 ? selected : enabled[0];
  function move(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(e.key) || enabled.length === 0) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const previous = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    let next = enabled[(enabled.indexOf(index) + (previous ? -1 : 1) + enabled.length) % enabled.length];
    if (e.key === 'Home') next = enabled[0];
    if (e.key === 'End') next = enabled[enabled.length - 1];
    refs.current[next]?.focus();
    onChange(options[next].value);
  }
  return <div className="fui-segments" role="radiogroup" aria-label={label}>
    {options.map((option, i) => <button type="button" role="radio" key={option.value}
      ref={el => { refs.current[i] = el; }} aria-checked={option.value === value}
      disabled={option.disabled} tabIndex={i === tabStop ? 0 : -1}
      onKeyDown={e => move(e, i)} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}
