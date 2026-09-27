'use client';

import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  /** Plain-language description of exactly what will happen. */
  description: ReactNode;
  /** Extra warning block for irreversible actions. */
  warning?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Gate for anything that changes live trading state.
 *
 * Destructive confirmations spell out the account and the position count,
 * because "Close All Positions" on the wrong account is unrecoverable.
 */
export function ConfirmModal({
  open,
  title,
  description,
  warning,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Sheet
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      actions={
        <>
          <button
            type="button"
            className={`btn btn--block ${destructive ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
          <button
            type="button"
            className="btn btn--block btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
        </>
      }
    >
      <div className="stack">
        <div>{description}</div>
        {warning && (
          <div className={`callout callout--${destructive ? 'danger' : 'warning'}`}>
            <Icon name="warning" size={18} />
            <span>{warning}</span>
          </div>
        )}
      </div>
    </Sheet>
  );
}
