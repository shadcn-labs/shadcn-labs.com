import { ANALYTICS_PROJECTS } from "./config";
import { isoDate } from "./range";
import type { AnalyticsRow, ProjectAnalytics, ReportingPeriod } from "./types";

const API_URL = "https://api.vercel.com";
const QUERIES_PER_PROJECT = 5;
/** Enough per project that merged top rows for any selection stay accurate. */
const TOP_ROWS_PER_PROJECT = 25;
/** Vercel folds everything past `limit` into this bucket; it is not a value. */
const OTHERS = "Others";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const countryName = (code: string): string => {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const projectByName = new Map(
  ANALYTICS_PROJECTS.map((project) => [project.name, project])
);
const projectHosts = new Map(
  ANALYTICS_PROJECTS.map((project) => [
    project.name,
    new URL(project.url).hostname.replace(/^www\./u, ""),
  ])
);

class VercelRequestError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message = `Vercel request failed with ${status}`
  ) {
    super(message);
    this.name = "VercelRequestError";
    this.status = status;
  }
}

type Row = Record<string, unknown>;
interface Period {
  since: string;
  until: string;
}
interface ListedProject {
  id: string;
  name: string;
  /** Vercel team that owns the project; every query for it is scoped to this team. */
  teamId: string;
  /** Token that can read this project's analytics. */
  token: string;
}
/** Raw query rows for one project in one refresh. */
interface ProjectRows {
  project: ListedProject;
  current: Row[];
  before: Row[] | null;
  days: Row[];
  countries: Row[];
  referrers: Row[];
}
interface RateLimit {
  remaining: number;
  resetAt: number;
}

/**
 * Vercel budgets are per token, so each token gets its own remaining/reset
 * values and its own cooldown window.
 */
const rateLimits = new Map<string, RateLimit>();
const cooldowns = new Map<string, number>();

const readRateLimit = (response: Response, token: string): void => {
  const remaining = Number(response.headers.get("x-ratelimit-remaining"));
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  const current = rateLimits.get(token) ?? {
    remaining: Number.POSITIVE_INFINITY,
    resetAt: 0,
  };
  if (
    Number.isFinite(remaining) &&
    response.headers.has("x-ratelimit-remaining")
  ) {
    current.remaining = remaining;
  }
  if (Number.isFinite(reset) && reset > 0) {
    current.resetAt = reset * 1000;
  }
  rateLimits.set(token, current);
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    cooldowns.set(
      token,
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Date.now() + retryAfter * 1000
        : Math.max(current.resetAt, Date.now() + 60_000)
    );
  }
};

const vercelFetch = async (
  path: string,
  params: Record<string, string>,
  token: string,
  teamId: string
): Promise<Row> => {
  const cooldown = cooldowns.get(token) ?? 0;
  if (Date.now() < cooldown) {
    throw new VercelRequestError(429, "Vercel rate limit cooldown");
  }
  const url = new URL(path, API_URL);
  url.searchParams.set("teamId", teamId);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  readRateLimit(response, token);
  if (!response.ok) {
    throw new VercelRequestError(response.status);
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new VercelRequestError(
      response.status,
      "Vercel returned a non-object body"
    );
  }
  return body as Row;
};

const metric = (row: Row, name: string): number => {
  const value = row[name];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Vercel returned an invalid "${name}" metric`);
  }
  return value;
};

/** Every project in a team, following Vercel's `until` cursor. */
const fetchProjectPages = async (
  token: string,
  teamId: string,
  until?: string
): Promise<Row[]> => {
  const body = await vercelFetch(
    "/v9/projects",
    { limit: "100", ...(until ? { until } : {}) },
    token,
    teamId
  );
  if (!Array.isArray(body.projects)) {
    throw new TypeError("Vercel returned an invalid project list");
  }
  const next = (body.pagination as Row | null | undefined)?.next;
  const cursor =
    typeof next === "number" || typeof next === "string"
      ? String(next)
      : undefined;
  if (cursor === undefined) {
    return body.projects as Row[];
  }
  if (cursor === until) {
    throw new Error("Vercel project pagination did not advance");
  }
  return [
    ...(body.projects as Row[]),
    ...(await fetchProjectPages(token, teamId, cursor)),
  ];
};

/**
 * A team's projects, or none when the token cannot see the team yet (for
 * example before an invite is accepted), so one missing team never blanks the
 * others. Any other failure still fails the refresh.
 */
const fetchTeamProjects = async (
  token: string,
  teamId: string
): Promise<Row[]> => {
  try {
    return await fetchProjectPages(token, teamId);
  } catch (error) {
    if (
      error instanceof VercelRequestError &&
      [401, 403, 404].includes(error.status)
    ) {
      console.warn(
        `[analytics] Vercel team ${teamId} is not accessible (HTTP ${error.status}); skipping its projects.`
      );
      return [];
    }
    throw error;
  }
};

/**
 * Listed projects with Web Analytics enabled for one team. The first team
 * configured in `ANALYTICS_SOURCES` wins if two teams expose the same project.
 */
const listProjects = async (
  teamId: string,
  token: string
): Promise<ListedProject[]> => {
  const rows = await fetchTeamProjects(token, teamId);
  const found = new Map<string, ListedProject>();
  for (const project of rows) {
    const analytics = project.webAnalytics as Row | null | undefined;
    if (typeof project.id !== "string" || !analytics?.enabledAt) {
      continue;
    }
    const targets = project.targets as
      | { production?: { alias?: unknown } | null }
      | null
      | undefined;
    const aliases = Array.isArray(targets?.production?.alias)
      ? (targets.production.alias as unknown[])
          .filter((alias): alias is string => typeof alias === "string")
          .map((alias) => alias.replace(/^www\./u, ""))
      : [];
    const match = [...projectByName.keys()].find((name) => {
      const entry = projectByName.get(name);
      return (
        name === project.name ||
        (entry !== undefined && aliases.includes(projectHosts.get(name) ?? ""))
      );
    });
    if (match && !found.has(match)) {
      found.set(match, {
        id: project.id,
        name: match,
        teamId,
        token,
      });
    }
  }
  return [...found.values()];
};

const aggregate = async (
  project: ListedProject,
  period: Period,
  by: string
): Promise<Row[]> => {
  const body = await vercelFetch(
    "/v1/query/web-analytics/visits/aggregate",
    {
      by,
      filter: "environment eq 'production'",
      limit: "100",
      projectId: project.id,
      since: `${period.since}T00:00:00.000Z`,
      // A bare date is rounded to the hour; keep the entire last day.
      until: `${period.until}T23:59:59.999Z`,
    },
    project.token,
    project.teamId
  );
  if (
    !Array.isArray(body.data) ||
    !body.data.every(
      (row) => typeof row === "object" && row !== null && !Array.isArray(row)
    )
  ) {
    throw new Error("Vercel returned invalid analytics rows");
  }
  const rows = body.data as Row[];
  for (const row of rows) {
    metric(row, "visitors");
    metric(row, "pageviews");
  }
  return rows;
};

const sum = (rows: Row[]): { visitors: number; pageviews: number } => ({
  pageviews: rows.reduce((total, row) => total + metric(row, "pageviews"), 0),
  visitors: rows.reduce((total, row) => total + metric(row, "visitors"), 0),
});

/**
 * Prior-period traffic, when the team's plan still exposes it. A Hobby team
 * only grants the latest 31 days, so the comparison window can return 400;
 * that hides the change figures without failing the whole refresh.
 */
const aggregatePrevious = async (
  project: ListedProject,
  period: Period
): Promise<Row[] | null> => {
  try {
    return await aggregate(project, period, "environment");
  } catch (error) {
    if (error instanceof VercelRequestError && error.status === 400) {
      console.warn(
        `[analytics] Vercel project ${project.name} has no prior-period data (HTTP 400); hiding its change figures.`
      );
      return null;
    }
    throw error;
  }
};

/** One project's top rows for a dimension, without Vercel's catch-all bucket. */
const top = (
  rows: Row[],
  dimension: string,
  label: (value: string) => string
): AnalyticsRow[] =>
  rows
    .filter(
      (row) =>
        typeof row[dimension] === "string" &&
        row[dimension] !== "" &&
        row[dimension] !== OTHERS
    )
    .map((row) => ({
      name: label(row[dimension] as string),
      pageviews: metric(row, "pageviews"),
      visitors: metric(row, "visitors"),
    }))
    .toSorted((a, b) => b.visitors - a.visitors)
    .slice(0, TOP_ROWS_PER_PROJECT);

export const fetchVercelProjects = async (
  source: {
    teamId: string;
    token: string;
  },
  period: ReportingPeriod
): Promise<ProjectAnalytics[]> => {
  const projects = await listProjects(source.teamId, source.token);
  if (projects.length === 0) {
    return [];
  }

  // Skip a refresh that cannot finish inside the remaining budget: a partial
  // snapshot would be wrong, and the attempt would only push into a 429.
  const needed = projects.length * QUERIES_PER_PROJECT;
  const budget = rateLimits.get(source.token);
  if (budget && budget.remaining < needed && budget.resetAt > Date.now()) {
    cooldowns.set(source.token, budget.resetAt);
    throw new VercelRequestError(
      429,
      `Vercel budget too low (${budget.remaining} left, ${needed} needed)`
    );
  }

  const current = {
    since: isoDate(period.start),
    until: isoDate(period.end),
  };
  const previous = {
    since: isoDate(period.previousStart),
    until: isoDate(period.previousEnd),
  };

  // One project at a time, its queries in parallel, so at most
  // QUERIES_PER_PROJECT requests are in flight. Any failure fails the whole
  // refresh: a snapshot missing a project would understate traffic, so the
  // previous snapshot is served instead.
  const loadProject = async (project: ListedProject): Promise<ProjectRows> => {
    const [currentRows, before, days, countries, referrers] = await Promise.all(
      [
        aggregate(project, current, "environment"),
        aggregatePrevious(project, previous),
        aggregate(project, current, "day"),
        aggregate(project, current, "country"),
        aggregate(project, current, "referrerHostname"),
      ]
    );
    return {
      before,
      countries,
      current: currentRows,
      days,
      project,
      referrers,
    };
  };
  const loadInOrder = async (
    remaining: ListedProject[]
  ): Promise<ProjectRows[]> =>
    remaining.length === 0
      ? []
      : [
          await loadProject(remaining[0]),
          ...(await loadInOrder(remaining.slice(1))),
        ];
  const results = await loadInOrder(projects);

  return results
    .map(({ before, countries, current: rows, days, project, referrers }) => {
      const byDate = new Map(
        days
          .filter((row) => typeof row.timestamp === "string")
          .map((row) => [String(row.timestamp).slice(0, 10), row])
      );
      return {
        countries: top(countries, "country", countryName),
        dailyPageviews: period.dates.map((date) => {
          const row = byDate.get(date);
          return row ? metric(row, "pageviews") : 0;
        }),
        dailyVisitors: period.dates.map((date) => {
          const row = byDate.get(date);
          return row ? metric(row, "visitors") : 0;
        }),
        name: project.name,
        previous: before === null ? null : sum(before),
        referrers: top(referrers, "referrerHostname", (value) => value),
        ...sum(rows),
      };
    })
    .toSorted((a, b) => b.visitors - a.visitors);
};
