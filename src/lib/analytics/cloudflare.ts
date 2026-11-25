import type { AnalyticsRow, ProjectAnalytics, ReportingPeriod } from "./types";

const API_URL = "https://api.cloudflare.com/client/v4/graphql";
const API_TIMEOUT_MS = 15_000;
const TOP_ROWS = 25;
const HIDDEN_NAMES = new Set(["", "Unknown"]);

const CURRENT_QUERY = `
  query Current(
    $accountTag: String!
    $siteTag: String!
    $since: Time!
    $until: Time!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        totals: rumPageloadEventsAdaptiveGroups(
          limit: 1
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
        ) {
          count
          sum {
            visits
          }
        }
        days: rumPageloadEventsAdaptiveGroups(
          limit: 100
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
          orderBy: [date_ASC]
        ) {
          count
          sum {
            visits
          }
          dimensions {
            date
          }
        }
        countries: rumPageloadEventsAdaptiveGroups(
          limit: ${TOP_ROWS}
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
          orderBy: [count_DESC]
        ) {
          count
          sum {
            visits
          }
          dimensions {
            countryName
          }
        }
        referrers: rumPageloadEventsAdaptiveGroups(
          limit: ${TOP_ROWS}
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
          orderBy: [count_DESC]
        ) {
          count
          sum {
            visits
          }
          dimensions {
            refererHost
          }
        }
      }
    }
  }
`;

const PREVIOUS_QUERY = `
  query Previous(
    $accountTag: String!
    $siteTag: String!
    $since: Time!
    $until: Time!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        totals: rumPageloadEventsAdaptiveGroups(
          limit: 1
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
        ) {
          count
          sum {
            visits
          }
        }
      }
    }
  }
`;

type Row = Record<string, unknown>;

class CloudflareRequestError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message = `Cloudflare request failed with ${status}`
  ) {
    super(message);
    this.name = "CloudflareRequestError";
    this.status = status;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!isObject(value)) {
    throw new Error(`Cloudflare returned an invalid "${field}" object`);
  }
  return value;
};

const readNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Cloudflare returned an invalid "${field}" metric`);
  }
  return value;
};

/** Cloudflare exposes visits, not unique visitors, so visits are the visitor count. */
const readTotals = (row: Row): { visitors: number; pageviews: number } => {
  const sum = isObject(row.sum) ? row.sum : {};
  return {
    pageviews: readNumber(row.count, "count"),
    visitors:
      sum.visits === undefined ? 0 : readNumber(sum.visits, "sum.visits"),
  };
};

const cloudflareFetch = async (
  source: { accountId: string; siteTag: string; token: string },
  query: string,
  since: number,
  until: number
): Promise<unknown> => {
  const response = await fetch(API_URL, {
    body: JSON.stringify({
      query,
      variables: {
        accountTag: source.accountId,
        since: new Date(since).toISOString(),
        siteTag: source.siteTag,
        until: new Date(until).toISOString(),
      },
    }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${source.token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new CloudflareRequestError(response.status);
  }
  const body: unknown = await response.json();
  if (!isObject(body)) {
    throw new CloudflareRequestError(
      response.status,
      "Cloudflare returned a non-object body"
    );
  }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const messages = body.errors.map((error) =>
      isObject(error) && typeof error.message === "string"
        ? error.message
        : "Unknown GraphQL error"
    );
    throw new CloudflareRequestError(
      response.status,
      `Cloudflare GraphQL error: ${messages.join("; ")}`
    );
  }
  return body;
};

const readGroups = (body: unknown, alias: string): Row[] => {
  const data = asObject(asObject(body, "response").data, "data");
  const viewer = asObject(data.viewer, "viewer");
  if (!Array.isArray(viewer.accounts) || viewer.accounts.length === 0) {
    throw new Error("Cloudflare returned no accessible accounts");
  }
  const account = asObject(viewer.accounts[0], "account");
  if (!Array.isArray(account[alias])) {
    throw new TypeError(`Cloudflare returned an invalid "${alias}" result`);
  }
  return account[alias].map((group) => asObject(group, alias));
};

const readDaily = (
  groups: Row[]
): Map<string, { visitors: number; pageviews: number }> => {
  const days = new Map<string, { visitors: number; pageviews: number }>();
  for (const group of groups) {
    const dimensions = asObject(group.dimensions, "dimensions");
    if (typeof dimensions.date !== "string") {
      continue;
    }
    const date = dimensions.date.slice(0, 10);
    days.set(date, readTotals(group));
  }
  return days;
};

const readTop = (groups: Row[], dimension: string): AnalyticsRow[] =>
  groups
    .map((group) => {
      const dimensions = asObject(group.dimensions, "dimensions");
      const name = dimensions[dimension];
      if (typeof name !== "string") {
        return null;
      }
      return { name, ...readTotals(group) };
    })
    .filter(
      (row): row is AnalyticsRow => row !== null && !HIDDEN_NAMES.has(row.name)
    )
    .toSorted((a, b) => b.visitors - a.visitors)
    .slice(0, TOP_ROWS);

export const fetchCloudflareProject = async (
  source: {
    accountId: string;
    project: string;
    siteTag: string;
    token: string;
  },
  period: ReportingPeriod
): Promise<ProjectAnalytics> => {
  const body = await cloudflareFetch(
    source,
    CURRENT_QUERY,
    period.start,
    period.end + 1
  );
  const [totalsGroup] = readGroups(body, "totals");
  const totals =
    totalsGroup === undefined
      ? { pageviews: 0, visitors: 0 }
      : readTotals(totalsGroup);
  const days = readDaily(readGroups(body, "days"));

  let previous: { visitors: number; pageviews: number } | null = null;
  try {
    const previousBody = await cloudflareFetch(
      source,
      PREVIOUS_QUERY,
      period.previousStart,
      period.previousEnd + 1
    );
    const [previousGroup] = readGroups(previousBody, "totals");
    previous =
      previousGroup === undefined
        ? { pageviews: 0, visitors: 0 }
        : readTotals(previousGroup);
  } catch (error) {
    console.warn(
      `[analytics] Cloudflare prior period is unavailable for ${source.project}; hiding its change figures.`,
      error
    );
  }

  return {
    countries: readTop(readGroups(body, "countries"), "countryName"),
    dailyPageviews: period.dates.map((date) => days.get(date)?.pageviews ?? 0),
    dailyVisitors: period.dates.map((date) => days.get(date)?.visitors ?? 0),
    name: source.project,
    pageviews: totals.pageviews,
    previous,
    referrers: readTop(readGroups(body, "referrers"), "refererHost"),
    visitors: totals.visitors,
  };
};
