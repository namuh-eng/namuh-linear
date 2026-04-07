interface LabelChipProps {
  name: string;
  color: string;
  className?: string;
}

export function LabelChip({ name, color, className = "" }: LabelChipProps) {
  return (
    <span
      title={name}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[12px] text-[var(--color-text-secondary)] ${className}`}
    >
      <span
        data-testid="label-dot"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
