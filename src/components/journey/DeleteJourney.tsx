"use client";

import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * A delete trigger plus its confirmation dialog. `trigger` renders the button
 * that opens the dialog; nothing is deleted until the user confirms.
 */
export function DeleteJourney({
  title,
  onDelete,
  trigger,
}: {
  title: string;
  onDelete: () => Promise<void>;
  trigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      setOpen(false);
    } catch {
      setError("Could not delete this journey. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <ConfirmDialog
        open={open}
        title="Delete this journey?"
        message={`“${title}” and all of its progress and XP will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        busy={busy}
        error={error}
        onConfirm={confirm}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
      />
    </>
  );
}

export function TrashIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
    </svg>
  );
}
