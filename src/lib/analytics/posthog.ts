import { PROJECTS } from "@/constants/projects";

import type { AnalyticsRow, ProjectAnalytics, ReportingPeriod } from "./types";

const API_TIMEOUT_MS = 15_000;
const TOP_ROWS = 25;
const HIDDEN_NAMES = new Set(["", "Unknown", "$direct"]);

const projectHosts = new Map(
  PROJECTS.map((project) => [
    project.name,
    new URL(project.url).hostname.replace(/^www\./u, "").toLowerCase(),
  ])
);

class PostHogRequestError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message = `PostHog request failed with ${status}`
  ) {
    super(message);
    this.name = "PostHogRequestError";
    this.status = status;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`PostHog returned an invalid "${field}" metric`);
  }
  return value;
};

const readDate = (value: unknown): string | null => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/u.test(value)) {
    return value.slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 86_400_000).toISOString().slice(0, 10);
  }
  return null;
};

/**
 * `timestamp` is a DateTime in the project's timezone, so the boundary must
 * name UTC explicitly; otherwise the first and last hours of the range slip.
 */
const dateLiteral = (timestamp: number): string => {
  const value = new Date(timestamp).toISOString().slice(0, 19);
  return `toDateTime('${value.replace("T", " ")}', 'UTC')`;
};

const pageviewFilter = (since: number, until: number): string =>
  `event = '$pageview' AND timestamp >= ${dateLiteral(since)} AND timestamp < ${dateLiteral(until)}`;

const totalsQuery = (since: number, until: number): string =>
  `SELECT count() AS pageviews, count(DISTINCT distinct_id) AS visitors FROM events WHERE ${pageviewFilter(since, until)}`;

const daysQuery = (since: number, until: number): string =>
  `SELECT toDate(toTimeZone(timestamp, 'UTC')) AS day, count() AS pageviews, count(DISTINCT distinct_id) AS visitors FROM events WHERE ${pageviewFilter(since, until)} GROUP BY day ORDER BY day ASC`;

const countriesQuery = (since: number, until: number): string =>
  `SELECT coalesce(properties.$geoip_country_name, properties.$geoip_country_code) AS country, count() AS pageviews, count(DISTINCT distinct_id) AS visitors FROM events WHERE ${pageviewFilter(since, until)} GROUP BY country ORDER BY visitors DESC LIMIT ${TOP_ROWS}`;

const referrersQuery = (since: number, until: number): string =>
  `SELECT properties.$referring_domain AS referrer, count() AS pageviews, count(DISTINCT distinct_id) AS visitors FROM events WHERE ${pageviewFilter(since, until)} GROUP BY referrer ORDER BY visitors DESC LIMIT ${TOP_ROWS}`;

const posthogQuery = async (
  source: { host: string; projectId: string; token: string },
  query: string
): Promise<unknown[][]> => {
  const url = new URL(
    `/api/projects/${encodeURIComponent(source.projectId)}/query/`,
    source.host
  );
  const response = await fetch(url, {
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${source.token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new PostHogRequestError(
      response.status,
      `PostHog returned a non-JSON body with ${response.status}`
    );
  }

  if (!response.ok) {
    const detail =
      isObject(body) && typeof body.detail === "string" ? body.detail : null;
    throw new PostHogRequestError(
      response.status,
      detail === null
        ? `PostHog request failed with ${response.status}`
        : `PostHog request failed with ${response.status}: ${detail}`
    );
  }
  if (!isObject(body) || !Array.isArray(body.results)) {
    throw new Error("PostHog returned an invalid query response");
  }
  if (!body.results.every((row) => Array.isArray(row))) {
    throw new Error("PostHog returned invalid query rows");
  }
  return body.results as unknown[][];
};

const readTotals = (
  rows: unknown[][]
): { pageviews: number; visitors: number } => {
  const [row] = rows;
  if (row === undefined) {
    return { pageviews: 0, visitors: 0 };
  }
  return {
    pageviews: readNumber(row[0], "pageviews"),
    visitors: readNumber(row[1], "visitors"),
  };
};

const readDaily = (
  rows: unknown[][]
): Map<string, { pageviews: number; visitors: number }> => {
  const days = new Map<string, { pageviews: number; visitors: number }>();
  for (const row of rows) {
    const date = readDate(row[0]);
    if (date === null) {
      continue;
    }
    days.set(date, {
      pageviews: readNumber(row[1], "pageviews"),
      visitors: readNumber(row[2], "visitors"),
    });
  }
  return days;
};

const readTop = (
  rows: unknown[][],
  exclude: string | undefined
): AnalyticsRow[] =>
  rows
    .map((row) => {
      const [name, pageviews, visitors] = row;
      if (typeof name !== "string" || HIDDEN_NAMES.has(name)) {
        return null;
      }
      const normalized = name.replace(/^www\./u, "").toLowerCase();
      if (exclude !== undefined && normalized === exclude) {
        return null;
      }
      return {
        name,
        pageviews: readNumber(pageviews, "pageviews"),
        visitors: readNumber(visitors, "visitors"),
      };
    })
    .filter((row): row is AnalyticsRow => row !== null)
    .toSorted((a, b) => b.visitors - a.visitors)
    .slice(0, TOP_ROWS);

export const fetchPostHogProject = async (
  source: {
    host: string;
    project: string;
    projectId: string;
    token: string;
  },
  period: ReportingPeriod
): Promise<ProjectAnalytics> => {
  const since = period.start;
  const until = period.end + 1;
  const previousSince = period.previousStart;
  const previousUntil = period.previousEnd + 1;

  const [totalsRows, daysRows, countriesRows, referrersRows, previousRows] =
    await Promise.all([
      posthogQuery(source, totalsQuery(since, until)),
      posthogQuery(source, daysQuery(since, until)),
      posthogQuery(source, countriesQuery(since, until)),
      posthogQuery(source, referrersQuery(since, until)),
      posthogQuery(source, totalsQuery(previousSince, previousUntil)).catch(
        (error: unknown) => {
          console.warn(
            `[analytics] PostHog prior period is unavailable for ${source.project}; hiding its change figures.`,
            error
          );
          return null;
        }
      ),
    ]);

  const totals = readTotals(totalsRows);
  const days = readDaily(daysRows);
  const selfHost = projectHosts.get(source.project);

  return {
    countries: readTop(countriesRows, undefined),
    dailyPageviews: period.dates.map((date) => days.get(date)?.pageviews ?? 0),
    dailyVisitors: period.dates.map((date) => days.get(date)?.visitors ?? 0),
    name: source.project,
    pageviews: totals.pageviews,
    previous: previousRows === null ? null : readTotals(previousRows),
    referrers: readTop(referrersRows, selfHost),
    visitors: totals.visitors,
  };
};
