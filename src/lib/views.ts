import type { FilterCondition } from "@/components/filter-bar";
export type ViewEntityType = "issues" | "projects";
export type ViewScope = "team" | "workspace";
export type ViewLayout = "list" | "board" | "timeline";
export type ProjectViewStatusFilter =
  | "all"
  | "planned"
  | "started"
  | "paused"
  | "completed"
  | "canceled";
export type ProjectViewSortOption =
  | "created-desc"
  | "created-asc"
  | "name-asc"
  | "progress-desc"
  | "target-date-asc";
export type GroupByOption =
  | "status"
  | "priority"
  | "assignee"
  | "label"
  | "project"
  | "none";
export type OrderByOption = "priority" | "created" | "updated" | "manual";
export interface DisplayProperties {
  id: boolean;
  status: boolean;
  assignee: boolean;
  priority: boolean;
  project: boolean;
  dueDate: boolean;
  milestone: boolean;
  labels: boolean;
  links: boolean;
  timeInStatus: boolean;
  created: boolean;
  updated: boolean;
  pullRequests: boolean;
}
export type ProjectViewGroupBy = "none" | "status" | "team";

export interface IssueViewDisplayOptions {
  groupBy: GroupByOption;
  subGroupBy: GroupByOption;
  orderBy: OrderByOption;
  displayProperties: DisplayProperties;
  showSubIssues: boolean;
  showTriageIssues: boolean;
  showEmptyColumns: boolean;
  timelineBy: "dueDate" | "created" | "updated";
}

export interface ProjectViewDisplayOptions {
  groupBy: ProjectViewGroupBy;
  showTeam: boolean;
  showLead: boolean;
  showTargetDate: boolean;
  showProgress: boolean;
}

export interface ViewFilterState {
  entityType: ViewEntityType;
  scope: ViewScope;
  issueFilters: FilterCondition[];
  issueDisplayOptions: IssueViewDisplayOptions;
  projectStatusFilter: ProjectViewStatusFilter;
  projectSortBy: ProjectViewSortOption;
  projectDisplayOptions: ProjectViewDisplayOptions;
}

export interface ViewSummary {
  id: string;
  name: string;
  layout: ViewLayout;
  isPersonal: boolean;
  owner: { name: string; image: string | null } | null;
  createdAt: string;
  updatedAt: string;
  entityType: ViewEntityType;
  scope: ViewScope;
  teamId: string | null;
  teamKey: string | null;
  teamName: string | null;
  filterState: ViewFilterState;
}

export const projectViewStatusOptions: Array<{
  value: ProjectViewStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "planned", label: "Planned" },
  { value: "started", label: "In progress" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

export const projectViewSortOptions: Array<{
  value: ProjectViewSortOption;
  label: string;
}> = [
  { value: "created-desc", label: "Newest" },
  { value: "created-asc", label: "Oldest" },
  { value: "name-asc", label: "Name" },
  { value: "progress-desc", label: "Progress" },
  { value: "target-date-asc", label: "Target date" },
];

const defaultDisplayProperties: DisplayProperties = {
  id: true,
  status: true,
  assignee: true,
  priority: true,
  project: true,
  dueDate: true,
  milestone: false,
  labels: true,
  links: false,
  timeInStatus: false,
  created: true,
  updated: false,
  pullRequests: false,
};

export const defaultIssueViewDisplayOptions: IssueViewDisplayOptions = {
  groupBy: "status",
  subGroupBy: "none",
  orderBy: "priority",
  displayProperties: { ...defaultDisplayProperties },
  showSubIssues: true,
  showTriageIssues: false,
  showEmptyColumns: false,
  timelineBy: "dueDate",
};

export const defaultProjectViewDisplayOptions: ProjectViewDisplayOptions = {
  groupBy: "status",
  showTeam: true,
  showLead: true,
  showTargetDate: true,
  showProgress: true,
};

const validGroupByOptions = new Set<GroupByOption>([
  "status",
  "priority",
  "assignee",
  "label",
  "project",
  "none",
]);
const validOrderByOptions = new Set<OrderByOption>([
  "priority",
  "created",
  "updated",
  "manual",
]);
const validProjectGroupByOptions = new Set<ProjectViewGroupBy>([
  "none",
  "status",
  "team",
]);

function isFilterCondition(value: unknown): value is FilterCondition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const filter = value as Partial<FilterCondition>;
  return (
    typeof filter.type === "string" &&
    (filter.operator === "is" || filter.operator === "isNot") &&
    Array.isArray(filter.values) &&
    filter.values.every((entry) => typeof entry === "string")
  );
}

function normalizeDisplayProperties(value: unknown): DisplayProperties {
  const record =
    value && typeof value === "object"
      ? (value as Partial<Record<keyof DisplayProperties, unknown>>)
      : {};
  return Object.fromEntries(
    Object.entries(defaultDisplayProperties).map(([key, defaultValue]) => [
      key,
      typeof record[key as keyof DisplayProperties] === "boolean"
        ? record[key as keyof DisplayProperties]
        : defaultValue,
    ]),
  ) as DisplayProperties;
}

function normalizeIssueDisplayOptions(value: unknown): IssueViewDisplayOptions {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    groupBy: validGroupByOptions.has(record.groupBy as GroupByOption)
      ? (record.groupBy as GroupByOption)
      : defaultIssueViewDisplayOptions.groupBy,
    subGroupBy: validGroupByOptions.has(record.subGroupBy as GroupByOption)
      ? (record.subGroupBy as GroupByOption)
      : defaultIssueViewDisplayOptions.subGroupBy,
    orderBy: validOrderByOptions.has(record.orderBy as OrderByOption)
      ? (record.orderBy as OrderByOption)
      : defaultIssueViewDisplayOptions.orderBy,
    displayProperties: normalizeDisplayProperties(record.displayProperties),
    showSubIssues:
      typeof record.showSubIssues === "boolean"
        ? record.showSubIssues
        : defaultIssueViewDisplayOptions.showSubIssues,
    showTriageIssues:
      typeof record.showTriageIssues === "boolean"
        ? record.showTriageIssues
        : defaultIssueViewDisplayOptions.showTriageIssues,
    showEmptyColumns:
      typeof record.showEmptyColumns === "boolean"
        ? record.showEmptyColumns
        : defaultIssueViewDisplayOptions.showEmptyColumns,
    timelineBy:
      record.timelineBy === "created" || record.timelineBy === "updated"
        ? record.timelineBy
        : "dueDate",
  };
}

function normalizeProjectDisplayOptions(
  value: unknown,
): ProjectViewDisplayOptions {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    groupBy: validProjectGroupByOptions.has(
      record.groupBy as ProjectViewGroupBy,
    )
      ? (record.groupBy as ProjectViewGroupBy)
      : defaultProjectViewDisplayOptions.groupBy,
    showTeam:
      typeof record.showTeam === "boolean"
        ? record.showTeam
        : defaultProjectViewDisplayOptions.showTeam,
    showLead:
      typeof record.showLead === "boolean"
        ? record.showLead
        : defaultProjectViewDisplayOptions.showLead,
    showTargetDate:
      typeof record.showTargetDate === "boolean"
        ? record.showTargetDate
        : defaultProjectViewDisplayOptions.showTargetDate,
    showProgress:
      typeof record.showProgress === "boolean"
        ? record.showProgress
        : defaultProjectViewDisplayOptions.showProgress,
  };
}

export function normalizeViewFilterState(
  value: unknown,
  teamId: string | null = null,
): ViewFilterState {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const entityType: ViewEntityType =
    record.entityType === "projects" ? "projects" : "issues";
  const scope: ViewScope =
    record.scope === "workspace" || (!teamId && record.scope !== "team")
      ? "workspace"
      : "team";
  const issueFilters = Array.isArray(record.issueFilters)
    ? record.issueFilters.filter(isFilterCondition)
    : [];
  const projectStatusFilter = projectViewStatusOptions.some(
    (option) => option.value === record.projectStatusFilter,
  )
    ? (record.projectStatusFilter as ProjectViewStatusFilter)
    : "all";
  const projectSortBy = projectViewSortOptions.some(
    (option) => option.value === record.projectSortBy,
  )
    ? (record.projectSortBy as ProjectViewSortOption)
    : "created-desc";

  return {
    entityType,
    scope,
    issueFilters,
    issueDisplayOptions: normalizeIssueDisplayOptions(
      record.issueDisplayOptions,
    ),
    projectStatusFilter,
    projectSortBy,
    projectDisplayOptions: normalizeProjectDisplayOptions(
      record.projectDisplayOptions,
    ),
  };
}
