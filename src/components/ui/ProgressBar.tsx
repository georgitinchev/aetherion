export function ProgressBar({
  value,
  tone = "holo",
  className = "",
}: {
  /** 0..1 */
  value: number;
  tone?: "holo" | "gold" | "success";
  className?: string;
}) {
  const fill = { holo: "bg-holo", gold: "bg-gold", success: "bg-success" }[tone];
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-surface-2 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${fill} transition-[width] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
