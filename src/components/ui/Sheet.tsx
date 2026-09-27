'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useMounted } from '@/hooks/useMounted';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Rendered below the body, typically stacked full-width buttons. */
  actions?: ReactNode;
}

/**
 * Bottom sheet on mobile, centred dialog from 768px up.
 * Secondary information and every control action goes through this.
 */
export function Sheet({ open, onClose, title, children, actions }: SheetProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // Stop the page behind the sheet from scrolling with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="sheet__grabber" />
        <h2 className="sheet__title">{title}</h2>
        <div className="sheet__body">{children}</div>
        {actions && <div className="sheet__actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
