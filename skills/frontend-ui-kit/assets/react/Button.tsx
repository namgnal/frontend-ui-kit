// Adapted patterns from open-claude-ui (MIT); see ../../licenses/NOTICE.md.
'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet';
  busy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'button', variant = 'secondary', busy = false, disabled, className = '', children, ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} disabled={disabled || busy}
    aria-busy={busy || undefined} className={`fui-button fui-button--${variant} ${className}`}>
    {busy && <span className="fui-spinner" aria-hidden="true" />}{children}
  </button>;
});
