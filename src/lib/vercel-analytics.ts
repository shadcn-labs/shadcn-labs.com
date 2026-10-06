import { getSecret } from "astro:env/server";

import { PROJECTS } from "@/constants/projects";

export interface AnalyticsRow {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface ProjectAnalytics {
  name: string;
  visitors: number;
  pageviews: number;
  /** The equally long period right before `since`, for the change figures. */
  previous: { visitors: number; pageviews: number };
  /** Daily values aligned with `AnalyticsSnapshot.dates`. */
  dailyVisitors: number[];
  dailyPageviews: number[];
  /** Top rows for this project, so any project selection can be merged client-side. */
  countries: AnalyticsRow[];
  referrers: AnalyticsRow[];
}

/**
 * Per-project data only: totals for any selection of projects are sums, so the
 * page can filter by project without another Vercel query.
 */
export interface AnalyticsSnapshot {
  /** ISO timestamp of the refresh that produced this snapshot. */
  fetchedAt: string;
  /** Every UTC date (YYYY-MM-DD) of the reporting period, oldest first. */
  dates: string[];
  /** Sorted by visitors, highest first. */
  projects: ProjectAnalytics[];
}

export interface AnalyticsResult {
  /** `null` only when there has never been a successful refresh. */
  snapshot: AnalyticsSnapshot | null;
  /** True when the last refresh failed and `snapshot` is an older copy. */
  stale: boolean;
}

/**
 * How long a good snapshot stays fresh, in seconds. A refresh costs one
 * project-list request plus five queries per project, against Vercel's
 * per-token budget of a few hundred requests per window, so an hourly refresh
 * stays far below the limit.
 */
export const ANALYTICS_CACHE_TTL_SECONDS = 3600;

/**
 * How long a failed refresh is remembered, in seconds, so a Vercel outage or
 * rate limit is not hammered by every visitor.
 */
export const ANALYTICS_FAILURE_CACHE_TTL_SECONDS = 300;

const API_URL = "https://api.vercel.com";
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;
const QUERIES_PER_PROJECT = 5;
/** Enough per project that merged top rows for any selection stay accurate. */
const TOP_ROWS_PER_PROJECT = 25;
/** Vercel folds everything past `limit` into this bucket; it is not a value. */
const OTHERS = "Others";

// skills.sh is an external directory, not a site whose traffic belongs to us.
const ANALYTICS_PROJECTS = PROJECTS.filter(
  (project) => project.name !== "skills"
);

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const countryName = (code: string): string => {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
};

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
}
/** Raw query rows for one project in one refresh. */
interface ProjectRows {
  project: ListedProject;
  current: Row[];
  before: Row[];
  days: Row[];
  countries: Row[];
  referrers: Row[];
}

/** Latest budget Vercel reported, so a refresh that cannot fit is skipped. */
const rateLimit = { remaining: Number.POSITIVE_INFINITY, resetAt: 0 };
/** No requests are sent before this time, set after a 429. */
let cooldownUntil = 0;

const readRateLimit = (response: Response): void => {
  const remaining = Number(response.headers.get("x-ratelimit-remaining"));
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (
    Number.isFinite(remaining) &&
    response.headers.has("x-ratelimit-remaining")
  ) {
    rateLimit.remaining = remaining;
  }
  if (Number.isFinite(reset) && reset > 0) {
    rateLimit.resetAt = reset * 1000;
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    cooldownUntil =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Date.now() + retryAfter * 1000
        : Math.max(rateLimit.resetAt, Date.now() + 60_000);
  }
};

const vercelFetch = async (
  path: string,
  params: Record<string, string>,
  token: string,
  teamId: string
): Promise<Row> => {
  if (Date.now() < cooldownUntil) {
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
  readRateLimit(response);
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
        `[vercel-analytics] Team ${teamId} is not accessible (HTTP ${error.status}); skipping its projects.`
      );
      return [];
    }
    throw error;
  }
};

/**
 * Listed projects with Web Analytics enabled, across every configured team.
 * If two teams have a match for the same listed project, the team listed first
 * in VERCEL_TEAM_IDS wins.
 */
const listProjects = async (
  token: string,
  teamIds: string[]
): Promise<ListedProject[]> => {
  const teams = await Promise.all(
    teamIds.map(async (teamId) => ({
      projects: await fetchTeamProjects(token, teamId),
      teamId,
    }))
  );
  const found = new Map<string, ListedProject>();
  for (const { projects, teamId } of teams) {
    for (const project of projects) {
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
      const listed = ANALYTICS_PROJECTS.find(
        (entry) =>
          entry.name === project.name ||
          aliases.includes(new URL(entry.url).hostname.replace(/^www\./u, ""))
      );
      if (listed && !found.has(listed.name)) {
        found.set(listed.name, { id: project.id, name: listed.name, teamId });
      }
    }
  }
  return [...found.values()];
};

const aggregate = async (
  token: string,
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
    token,
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

const isoDate = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

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

const refresh = async (): Promise<AnalyticsSnapshot> => {
  const token = getSecret("VERCEL_TOKEN");
  // Comma-separated; the token's account must be a member of every team.
  const teamIds = [
    ...new Set(
      (getSecret("VERCEL_TEAM_IDS") ?? "")
        .split(",")
        .map((teamId) => teamId.trim())
        .filter(Boolean)
    ),
  ];
  if (!token || teamIds.length === 0) {
    throw new Error("VERCEL_TOKEN and VERCEL_TEAM_IDS must be set");
  }

  const projects = await listProjects(token, teamIds);
  if (projects.length === 0) {
    throw new Error("No listed project has Web Analytics enabled");
  }

  // Skip a refresh that cannot finish inside the remaining budget: a partial
  // snapshot would be wrong, and the attempt would only push into a 429.
  const needed = projects.length * QUERIES_PER_PROJECT;
  if (rateLimit.remaining < needed && rateLimit.resetAt > Date.now()) {
    cooldownUntil = rateLimit.resetAt;
    throw new VercelRequestError(
      429,
      `Vercel budget too low (${rateLimit.remaining} left, ${needed} needed)`
    );
  }

  // Whole UTC days ending yesterday, so the last point is never a partial day.
  const today = Date.parse(`${isoDate(Date.now())}T00:00:00.000Z`);
  const end = today - DAY_MS;
  const start = end - (PERIOD_DAYS - 1) * DAY_MS;
  const period = { since: isoDate(start), until: isoDate(end) };
  const previous = {
    since: isoDate(start - PERIOD_DAYS * DAY_MS),
    until: isoDate(start - DAY_MS),
  };

  // One project at a time, its QUERIES_PER_PROJECT queries in parallel, so at
  // most that many requests are in flight. Any failure fails the whole
  // refresh: a snapshot missing a project would understate traffic, so the
  // previous snapshot is served instead.
  const loadProject = async (project: ListedProject): Promise<ProjectRows> => {
    const [current, before, days, countries, referrers] = await Promise.all([
      aggregate(token, project, period, "environment"),
      aggregate(token, project, previous, "environment"),
      aggregate(token, project, period, "day"),
      aggregate(token, project, period, "country"),
      aggregate(token, project, period, "referrerHostname"),
    ]);
    return { before, countries, current, days, project, referrers };
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

  const dates: string[] = [];
  for (let day = start; day <= end; day += DAY_MS) {
    dates.push(isoDate(day));
  }

  const projectsAnalytics = results
    .map(({ before, countries, current, days, project, referrers }) => {
      const byDate = new Map(
        days
          .filter((row) => typeof row.timestamp === "string")
          .map((row) => [String(row.timestamp).slice(0, 10), row])
      );
      return {
        countries: top(countries, "country", countryName),
        dailyPageviews: dates.map((date) => {
          const row = byDate.get(date);
          return row ? metric(row, "pageviews") : 0;
        }),
        dailyVisitors: dates.map((date) => {
          const row = byDate.get(date);
          return row ? metric(row, "visitors") : 0;
        }),
        name: project.name,
        previous: sum(before),
        referrers: top(referrers, "referrerHostname", (value) => value),
        ...sum(current),
      };
    })
    .toSorted((a, b) => b.visitors - a.visitors);

  return {
    dates,
    fetchedAt: new Date().toISOString(),
    projects: projectsAnalytics,
  };
};

let cached: { expires: number; result: AnalyticsResult } | undefined;
let inflight: Promise<AnalyticsResult> | undefined;

/**
 * Production traffic across the listed projects for the last 30 whole UTC
 * days. Cached in-process for ANALYTICS_CACHE_TTL_SECONDS and deduplicated
 * while a refresh is running; the page wrapping this also sets an edge cache,
 * so a cache hit never reaches Vercel. A failed refresh keeps serving the last
 * good snapshot marked stale and is not retried for
 * ANALYTICS_FAILURE_CACHE_TTL_SECONDS.
 */
export const getSponsorAnalytics = (): Promise<AnalyticsResult> => {
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.result);
  }
  inflight ??= (async () => {
    const previous = cached?.result.snapshot ?? null;
    try {
      const result = { snapshot: await refresh(), stale: false };
      cached = {
        expires: Date.now() + ANALYTICS_CACHE_TTL_SECONDS * 1000,
        result,
      };
      return result;
    } catch (error) {
      const result = { snapshot: previous, stale: true };
      cached = {
        expires: Math.max(
          Date.now() + ANALYTICS_FAILURE_CACHE_TTL_SECONDS * 1000,
          cooldownUntil
        ),
        result,
      };
      console.warn(
        previous
          ? `[vercel-analytics] Refresh failed, serving the snapshot from ${previous.fetchedAt}.`
          : "[vercel-analytics] Refresh failed and there is no snapshot to fall back on.",
        error
      );
      return result;
    } finally {
      inflight = undefined;
    }
  })();
  return inflight;
};
