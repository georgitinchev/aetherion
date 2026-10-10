import type { ReactNode } from "react";

/** Duolingo-style sticky action bar; tints green/red for quiz feedback. */
export function BottomBar({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass = {
    neutral: "border-border bg-bg/90",
    success: "border-success/30 bg-(--success-bar)/95",
    danger: "border-danger/30 bg-(--danger-bar)/95",
  }[tone];
  return (
    <div className={`fixed inset-x-0 bottom-0 z-20 border-t-2 backdrop-blur-xl ${toneClass}`}>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
    </div>
  );
}
