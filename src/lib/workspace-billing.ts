import { resolveRequestWorkspaceId } from "@/lib/active-workspace";
import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

import {
  BILLING_PRICING_PLANS,
  type HostedPricingPlanId,
  LEGACY_PLAN_ID_MAP,
  isHostedPricingPlanId,
  normalizePricingPlanId,
} from "@/lib/pricing";

export type BillingPlanId = HostedPricingPlanId;

export const BILLING_PLANS = BILLING_PRICING_PLANS;

type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export function normalizeBillingPlan(value: unknown): BillingPlanId {
  return normalizePricingPlanId(value);
}

export function isSupportedBillingPlanInput(value: unknown): boolean {
  return (
    isHostedPricingPlanId(value) ||
    (typeof value === "string" && value in LEGACY_PLAN_ID_MAP)
  );
}

export function readBillingState(settings: unknown) {
  const parsed = asRecord(settings);
  const billing = asRecord(parsed.billing);
  const paymentMethods = Array.isArray(billing.paymentMethods)
    ? billing.paymentMethods
    : [
        {
          id: "pm_dev_visa",
          brand: "Visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2030,
          isDefault: true,
        },
      ];
  const invoices = Array.isArray(billing.invoices)
    ? billing.invoices
    : [
        {
          id: "inv_dev_001",
          number: "DEV-001",
          date: "2026-05-01",
          amount: "$0.00",
          status: "paid",
        },
      ];

  return {
    plan: normalizeBillingPlan(billing.plan ?? parsed.plan),
    seatsUsed: typeof billing.seatsUsed === "number" ? billing.seatsUsed : 3,
    usageLimit:
      typeof billing.usageLimit === "number" ? billing.usageLimit : 250,
    issuesUsed:
      typeof billing.issuesUsed === "number" ? billing.issuesUsed : 42,
    paymentMethods,
    invoices,
  };
}

export async function findBillingWorkspace(userId: string, request: Request) {
  const workspaceId = await resolveRequestWorkspaceId(userId, request);
  if (!workspaceId) {
    return null;
  }

  const [record] = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      urlSlug: workspace.urlSlug,
      settings: workspace.settings,
      role: member.role,
    })
    .from(workspace)
    .innerJoin(
      member,
      and(
        eq(member.workspaceId, workspace.id),
        eq(member.userId, userId),
        eq(member.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  return record ?? null;
}

export function canManageBilling(role: string) {
  return role === "owner" || role === "admin";
}
