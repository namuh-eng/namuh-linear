export type RecurringIssueCadence = "daily" | "weekly" | "monthly";

export type RecurringIssueCadenceConfig = {
  cadence: RecurringIssueCadence;
  interval: number;
};

const VALID_CADENCES = new Set<RecurringIssueCadence>([
  "daily",
  "weekly",
  "monthly",
]);

export function parseDateTimeInput(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function normalizeCadenceConfig(
  input: unknown,
):
  | { config: RecurringIssueCadenceConfig; error: null }
  | { config: null; error: string } {
  const raw = input as { cadence?: unknown; interval?: unknown } | null;
  const cadence = raw?.cadence;
  if (
    typeof cadence !== "string" ||
    !VALID_CADENCES.has(cadence as RecurringIssueCadence)
  ) {
    return { config: null, error: "Choose a valid cadence" };
  }

  const interval = Number(raw?.interval ?? 1);
  if (!Number.isInteger(interval) || interval < 1 || interval > 52) {
    return { config: null, error: "Cadence interval must be between 1 and 52" };
  }

  return {
    config: { cadence: cadence as RecurringIssueCadence, interval },
    error: null,
  };
}

export function computeNextRunAt(
  config: RecurringIssueCadenceConfig,
  startAt: Date,
  now = new Date(),
): Date {
  const next = new Date(startAt);
  if (Number.isNaN(next.getTime())) {
    throw new Error("Invalid start date");
  }

  while (next.getTime() < now.getTime()) {
    if (config.cadence === "daily") {
      next.setDate(next.getDate() + config.interval);
    } else if (config.cadence === "weekly") {
      next.setDate(next.getDate() + config.interval * 7);
    } else {
      next.setMonth(next.getMonth() + config.interval);
    }
  }

  return next;
}

export function formatCadence(config: RecurringIssueCadenceConfig) {
  const unit = config.cadence.slice(0, -2);
  if (config.interval === 1) {
    return config.cadence === "daily" ? "Daily" : `Every ${unit}`;
  }

  return `Every ${config.interval} ${config.cadence === "daily" ? "days" : `${unit}s`}`;
}
