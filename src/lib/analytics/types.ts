export interface AnalyticsRow {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface ProjectAnalytics {
  name: string;
  visitors: number;
  pageviews: number;
  /**
   * The equally long period right before the reporting period, or `null` when
   * the source cannot expose it. Missing history is excluded from growth
   * comparisons and labeled in the UI, never treated as zero traffic.
   */
  previous: { visitors: number; pageviews: number } | null;
  /** Daily values aligned with `AnalyticsSnapshot.dates`. */
  dailyVisitors: number[];
  dailyPageviews: number[];
  /** Top rows for this project, so any project selection can be merged client-side. */
  countries: AnalyticsRow[];
  referrers: AnalyticsRow[];
}

/**
 * Per-project data only: totals for any selection of projects are sums, so the
 * page can filter by project without another provider query.
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

/** Whole UTC days ending yesterday, plus the equally long period before it. */
export interface ReportingPeriod {
  /** Every UTC date (YYYY-MM-DD), oldest first. */
  dates: string[];
  /** Inclusive start of the first day, as a Unix timestamp. */
  start: number;
  /** Inclusive end of the last day, as a Unix timestamp. */
  end: number;
  /** Inclusive start of the prior period, as a Unix timestamp. */
  previousStart: number;
  /** Inclusive end of the prior period, as a Unix timestamp. */
  previousEnd: number;
}

interface AnalyticsSourceBase {
  /**
   * Name of the environment variable holding this source's API token. Every
   * source must name its own variable; no default or shared fallback is used.
   */
  tokenEnv: string;
}

/** A Vercel team whose Web Analytics-enabled projects are discovered automatically. */
export interface VercelSource extends AnalyticsSourceBase {
  provider: "vercel";
  teamId: string;
}

/** One Cloudflare Web Analytics site. */
export interface CloudflareSource extends AnalyticsSourceBase {
  provider: "cloudflare";
  /** Name from `PROJECTS`. */
  project: string;
  accountId: string;
  siteTag: string;
}

/** One PostHog project. `host` is the API origin, e.g. `https://us.posthog.com`. */
export interface PostHogSource extends AnalyticsSourceBase {
  provider: "posthog";
  /** Name from `PROJECTS`. */
  project: string;
  /** PostHog project id, not the project name. */
  projectId: string;
  host: string;
}

export type AnalyticsSource = VercelSource | CloudflareSource | PostHogSource;

/** A source with its token already resolved from `tokenEnv`. */
export type ResolvedSource =
  | (VercelSource & { token: string })
  | (CloudflareSource & { token: string })
  | (PostHogSource & { token: string });
