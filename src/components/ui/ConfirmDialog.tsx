"use client";

import { useEffect, useId, useRef } from "react";
import { Spinner } from "./Spinner";

/**
 * "Are you sure?" modal built on the native <dialog>, which brings focus
 * trapping, Escape-to-close and a backdrop for free.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Escape: let React state close it, so open/closed never drift apart.
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      // A click on the backdrop lands on the <dialog> element itself.
      onClick={(e) => {
        if (e.target === dialog.current && !busy) onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-3xl border border-border bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm leading-6 text-muted">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="btn btn-ghost" autoFocus>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="btn btn-danger">
            {busy ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
