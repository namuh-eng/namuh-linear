type ExponentialMarkProps = {
  size?: number;
  className?: string;
  label?: string;
};

export function ExponentialMark({
  size = 18,
  className = "",
  label = "exponential logo",
}: ExponentialMarkProps) {
  return (
    <span
      aria-label={label}
      role="img"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      className={`inline-flex shrink-0 items-center justify-center border border-current font-medium tracking-tight ${className}`}
    >
      e
    </span>
  );
}
